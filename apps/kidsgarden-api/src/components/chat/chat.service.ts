import { BadRequestException, ForbiddenException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId, PipelineStage } from 'mongoose';
import { Application } from '../../libs/dto/application/application';
import { Child } from '../../libs/dto/child/child';
import { Conversation } from '../../libs/dto/conversation/conversation';
import { ParentTeacherConversationInput } from '../../libs/dto/conversation/conversation.input';
import { Group } from '../../libs/dto/group/group';
import { ChatAttachment, Message as ChatMessage, Messages } from '../../libs/dto/message/message';
import { ChatAttachmentInput, MessagesInquiry, SendMessageInput } from '../../libs/dto/message/message.input';
import { KindergartenStaff } from '../../libs/dto/kindergarten-staff/kindergarten-staff';
import { Member } from '../../libs/dto/member/member';
import { ChildStatus } from '../../libs/enums/child.enum';
import { ConversationType } from '../../libs/enums/chat.enum';
import { Direction, Message as SystemMessage } from '../../libs/enums/common.enum';
import { GroupStatus } from '../../libs/enums/group.enum';
import { StaffRole, StaffStatus } from '../../libs/enums/kindergarten-staff.enum';
import { MemberStatus, MemberType } from '../../libs/enums/member.enum';
import { NotificationTargetType, NotificationType } from '../../libs/enums/notification.enum';
import { capPaginationLimit, maxChatImageSize, maxChatImages, validChatImageMimeTypes } from '../../libs/config';
import { T } from '../../libs/types/common';
import { NotificationInput } from '../../libs/dto/notification/notification.input';
import { NotificationService } from '../notification/notification.service';
import { RedisService } from '../redis/redis.service';
import { RealtimeService } from '../realtime/realtime.service';

const APPLICATION_CHAT_MESSAGE_CREATED_EVENT = 'application_chat.message.created';
const PARENT_TEACHER_CHAT_MESSAGE_CREATED_EVENT = 'parent_teacher_chat.message.created';

interface ParentTeacherChatContext {
	child: Child;
	group: Group;
	teacherId: ObjectId;
	participantIds: ObjectId[];
}

interface MessagePayload {
	text?: string;
	attachments: ChatAttachment[];
	lastMessage: string;
}

@Injectable()
export class ChatService {
	private readonly logger = new Logger(ChatService.name);
	private readonly messagesListMaxLimit = 100;
	private readonly maxMessageLength = 2000;
	private readonly messageSortFields = ['createdAt', 'updatedAt'];

	constructor(
		@InjectModel('Application') private readonly applicationModel: Model<Application>,
		@InjectModel('Child') private readonly childModel: Model<Child>,
		@InjectModel('Conversation') private readonly conversationModel: Model<Conversation>,
		@InjectModel('Group') private readonly groupModel: Model<Group>,
		@InjectModel('KindergartenStaff') private readonly kindergartenStaffModel: Model<KindergartenStaff>,
		@InjectModel('Member') private readonly memberModel: Model<Member>,
		@InjectModel('Message') private readonly messageModel: Model<ChatMessage>,
		private readonly notificationService: NotificationService,
		private readonly redisService: RedisService,
	) {}

	public async getOrCreateApplicationConversation(authMember: Member, applicationId: ObjectId): Promise<Conversation> {
		const application = await this.findApplicationOrFail(applicationId);
		await this.assertCanAccessApplicationChat(authMember, application);

		const participantIds = await this.getApplicationParticipantIds(application);
		const existingConversation = await this.conversationModel
			.findOne({ type: ConversationType.APPLICATION_CHAT, applicationId: application._id })
			.exec();

		if (existingConversation) return await this.syncConversationParticipants(existingConversation, participantIds);

		try {
			return await this.conversationModel.create({
				type: ConversationType.APPLICATION_CHAT,
				applicationId: application._id,
				kindergartenId: application.kindergartenId,
				parentId: application.parentId,
				participantIds,
			});
		} catch (err: any) {
			if (err?.code === 11000) {
				const conversation = await this.conversationModel
					.findOne({ type: ConversationType.APPLICATION_CHAT, applicationId: application._id })
					.exec();
				if (conversation) return await this.syncConversationParticipants(conversation, participantIds);
			}
			throw new BadRequestException(SystemMessage.CREATE_FAILED);
		}
	}

	public async getConversation(authMember: Member, conversationId: ObjectId): Promise<Conversation> {
		const conversation = await this.findConversationOrFail(conversationId, ConversationType.APPLICATION_CHAT);
		await this.assertCanAccessConversation(authMember, conversation);
		if (!conversation.applicationId) throw new InternalServerErrorException(SystemMessage.NO_DATA_FOUND);

		const application = await this.findApplicationOrFail(conversation.applicationId);
		const participantIds = await this.getApplicationParticipantIds(application);
		return await this.syncConversationParticipants(conversation, participantIds);
	}

	public async getMessages(authMember: Member, input: MessagesInquiry): Promise<Messages> {
		const conversation = await this.findConversationOrFail(input.search.conversationId, ConversationType.APPLICATION_CHAT);
		await this.assertCanAccessConversation(authMember, conversation);

		return await this.findMessages(conversation._id, input);
	}

	public async sendMessage(authMember: Member, input: SendMessageInput): Promise<ChatMessage> {
		const conversation = await this.findConversationOrFail(input.conversationId, ConversationType.APPLICATION_CHAT);
		await this.assertCanAccessConversation(authMember, conversation);

		const payload = this.validateMessagePayload(input);

		try {
			const message = await this.messageModel.create({
				conversationId: conversation._id,
				senderId: authMember._id,
				...(payload.text ? { text: payload.text } : {}),
				attachments: payload.attachments,
				readBy: [authMember._id],
			});

			await this.conversationModel
				.findByIdAndUpdate(conversation._id, {
					lastMessage: payload.lastMessage,
					lastMessageAt: message.createdAt,
				})
				.exec();

			void this.publishApplicationChatMessageCreated(conversation, message).catch((err) => {
				this.logger.warn(`Application chat realtime publish failed: ${this.getErrorMessage(err)}`);
			});

			void this.reserveApplicationChatMessageCreatedHooks(conversation, message).catch((err) => {
				console.log('Application chat notification hook failed:', err.message);
			});

			return message;
		} catch (err) {
			throw new BadRequestException(SystemMessage.CREATE_FAILED);
		}
	}

	public async markConversationRead(authMember: Member, conversationId: ObjectId): Promise<boolean> {
		const conversation = await this.findConversationOrFail(conversationId, ConversationType.APPLICATION_CHAT);
		await this.assertCanAccessConversation(authMember, conversation);

		return await this.markConversationReadById(authMember, conversation._id);
	}

	public async getOrCreateParentTeacherConversation(
		authMember: Member,
		input: ParentTeacherConversationInput,
	): Promise<Conversation> {
		const context = await this.resolveParentTeacherChatContext(authMember, input.childId, input.teacherId);
		const existingConversation = await this.conversationModel
			.findOne({
				type: ConversationType.PARENT_TEACHER_CHAT,
				childId: context.child._id,
				teacherId: context.teacherId,
			})
			.exec();

		if (existingConversation) return await this.syncConversationParticipants(existingConversation, context.participantIds);

		try {
			return await this.conversationModel.create({
				type: ConversationType.PARENT_TEACHER_CHAT,
				kindergartenId: context.child.kindergartenId,
				parentId: context.child.parentId,
				childId: context.child._id,
				groupId: context.group._id,
				teacherId: context.teacherId,
				participantIds: context.participantIds,
			});
		} catch (err: any) {
			if (err?.code === 11000) {
				const conversation = await this.conversationModel
					.findOne({
						type: ConversationType.PARENT_TEACHER_CHAT,
						childId: context.child._id,
						teacherId: context.teacherId,
					})
					.exec();
				if (conversation) return await this.syncConversationParticipants(conversation, context.participantIds);
			}
			throw new BadRequestException(SystemMessage.CREATE_FAILED);
		}
	}

	public async getParentTeacherConversation(authMember: Member, conversationId: ObjectId): Promise<Conversation> {
		const conversation = await this.findConversationOrFail(conversationId, ConversationType.PARENT_TEACHER_CHAT);
		const context = await this.assertCanAccessParentTeacherConversation(authMember, conversation);

		return await this.syncConversationParticipants(conversation, context.participantIds);
	}

	public async getParentTeacherMessages(authMember: Member, input: MessagesInquiry): Promise<Messages> {
		const conversation = await this.findConversationOrFail(
			input.search.conversationId,
			ConversationType.PARENT_TEACHER_CHAT,
		);
		await this.assertCanAccessParentTeacherConversation(authMember, conversation);

		return await this.findMessages(conversation._id, input);
	}

	public async sendParentTeacherMessage(authMember: Member, input: SendMessageInput): Promise<ChatMessage> {
		const conversation = await this.findConversationOrFail(input.conversationId, ConversationType.PARENT_TEACHER_CHAT);
		const context = await this.assertCanAccessParentTeacherConversation(authMember, conversation);
		const activeConversation = await this.syncConversationParticipants(conversation, context.participantIds);

		const payload = this.validateMessagePayload(input);

		try {
			const message = await this.messageModel.create({
				conversationId: activeConversation._id,
				senderId: authMember._id,
				...(payload.text ? { text: payload.text } : {}),
				attachments: payload.attachments,
				readBy: [authMember._id],
			});

			await this.conversationModel
				.findByIdAndUpdate(activeConversation._id, {
					lastMessage: payload.lastMessage,
					lastMessageAt: message.createdAt,
				})
				.exec();

			void this.publishParentTeacherChatMessageCreated(activeConversation, message).catch((err) => {
				this.logger.warn(`Parent-teacher chat realtime publish failed: ${this.getErrorMessage(err)}`);
			});

			void this.reserveParentTeacherChatMessageCreatedHooks(activeConversation, message, context).catch((err) => {
				console.log('Parent-teacher chat notification hook failed:', err.message);
			});

			return message;
		} catch (err) {
			throw new BadRequestException(SystemMessage.CREATE_FAILED);
		}
	}

	public async markParentTeacherConversationRead(authMember: Member, conversationId: ObjectId): Promise<boolean> {
		const conversation = await this.findConversationOrFail(conversationId, ConversationType.PARENT_TEACHER_CHAT);
		await this.assertCanAccessParentTeacherConversation(authMember, conversation);

		return await this.markConversationReadById(authMember, conversation._id);
	}

	private validateMessagePayload(input: SendMessageInput): MessagePayload {
		const text = input.text?.trim();
		if (text && text.length > this.maxMessageLength) throw new BadRequestException(SystemMessage.BAD_REQUEST);

		const attachments = this.validateChatAttachments(input.attachments);
		if (!text && !attachments.length) throw new BadRequestException(SystemMessage.BAD_REQUEST);

		return {
			...(text ? { text } : {}),
			attachments,
			lastMessage: text || (attachments.length > 1 ? 'Image attachments' : 'Image attachment'),
		};
	}

	private validateChatAttachments(attachments?: ChatAttachmentInput[]): ChatAttachment[] {
		if (attachments === undefined || attachments === null) return [];
		if (!Array.isArray(attachments)) throw new BadRequestException(SystemMessage.BAD_REQUEST);
		if (!attachments.length) return [];
		if (attachments.length > maxChatImages) throw new BadRequestException(SystemMessage.BAD_REQUEST);

		return attachments.map((attachment) => {
			const url = attachment?.url?.trim();
			const name = attachment?.name?.trim();
			const mimeType = attachment?.mimeType?.trim();
			const size = Number(attachment?.size);

			const validAttachment =
				url &&
				name &&
				mimeType &&
				Number.isFinite(size) &&
				size > 0 &&
				size <= maxChatImageSize &&
				url.startsWith('uploads/chat/') &&
				!url.includes('..') &&
				!url.includes('\\') &&
				validChatImageMimeTypes.includes(mimeType);

			if (!validAttachment) throw new BadRequestException(SystemMessage.BAD_REQUEST);

			return {
				url,
				name,
				mimeType,
				size,
			};
		});
	}

	private async markConversationReadById(authMember: Member, conversationId: ObjectId): Promise<boolean> {
		await this.messageModel
			.updateMany(
				{
					conversationId,
					readBy: { $ne: authMember._id },
				},
				{ $addToSet: { readBy: authMember._id } },
			)
			.exec();

		return true;
	}

	private async findMessages(conversationId: ObjectId, input: MessagesInquiry): Promise<Messages> {
		const sortField = this.messageSortFields.includes(input?.sort) ? input.sort : 'createdAt';
		const sort: T = { [sortField]: input?.direction ?? Direction.DESC };
		const limit = capPaginationLimit(input.limit, this.messagesListMaxLimit);
		const listPipeline: PipelineStage.FacetPipelineStage[] = [
			{ $skip: (input.page - 1) * limit },
			{ $limit: limit },
		];

		const result = await this.messageModel
			.aggregate([
				{ $match: { conversationId } },
				{ $sort: sort },
				{
					$facet: {
						list: listPipeline,
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();

		if (!result.length) throw new InternalServerErrorException(SystemMessage.NO_DATA_FOUND);

		return result[0];
	}

	private async findApplicationOrFail(applicationId: ObjectId): Promise<Application> {
		const application = await this.applicationModel.findById(applicationId).exec();
		if (!application) throw new InternalServerErrorException(SystemMessage.NO_DATA_FOUND);

		return application;
	}

	private async findConversationOrFail(conversationId: ObjectId, type: ConversationType): Promise<Conversation> {
		const conversation = await this.conversationModel.findById(conversationId).exec();
		if (!conversation || conversation.type !== type) {
			throw new InternalServerErrorException(SystemMessage.NO_DATA_FOUND);
		}

		return conversation;
	}

	private async assertCanAccessConversation(authMember: Member, conversation: Conversation): Promise<void> {
		if (!conversation.applicationId) throw new InternalServerErrorException(SystemMessage.NO_DATA_FOUND);

		const application = await this.findApplicationOrFail(conversation.applicationId);
		await this.assertCanAccessApplicationChat(authMember, application);
	}

	private async assertCanAccessParentTeacherConversation(
		authMember: Member,
		conversation: Conversation,
	): Promise<ParentTeacherChatContext> {
		if (!conversation.childId || !conversation.teacherId) {
			throw new InternalServerErrorException(SystemMessage.NO_DATA_FOUND);
		}

		return await this.resolveParentTeacherChatContext(authMember, conversation.childId, conversation.teacherId);
	}

	private async resolveParentTeacherChatContext(
		authMember: Member,
		childId: ObjectId,
		requestedTeacherId?: ObjectId,
	): Promise<ParentTeacherChatContext> {
		const child = await this.childModel.findOne({ _id: childId, childStatus: ChildStatus.ACTIVE }).exec();
		if (!child) throw new InternalServerErrorException(SystemMessage.NO_DATA_FOUND);

		const group = await this.groupModel
			.findOne({
				_id: child.groupId,
				groupStatus: { $in: [GroupStatus.ACTIVE, GroupStatus.FULL] },
			})
			.exec();
		if (!group || group.kindergartenId.toString() !== child.kindergartenId.toString()) {
			throw new InternalServerErrorException(SystemMessage.NO_DATA_FOUND);
		}

		let teacherId: ObjectId;

		if (authMember.memberType === MemberType.PARENT) {
			if (child.parentId.toString() !== authMember._id.toString()) {
				throw new ForbiddenException(SystemMessage.NOT_ALLOWED_REQUEST);
			}
			if (!requestedTeacherId) throw new BadRequestException(SystemMessage.BAD_REQUEST);
			teacherId = requestedTeacherId;
		} else if (authMember.memberType === MemberType.TEACHER) {
			if (requestedTeacherId && requestedTeacherId.toString() !== authMember._id.toString()) {
				throw new ForbiddenException(SystemMessage.NOT_ALLOWED_REQUEST);
			}
			teacherId = authMember._id;
		} else {
			throw new ForbiddenException(SystemMessage.ONLY_SPECIFIC_ROLES_ALLOWED);
		}

		const teacherAssigned = group.teacherIds.some(
			(groupTeacherId: ObjectId) => groupTeacherId.toString() === teacherId.toString(),
		);
		if (!teacherAssigned) throw new ForbiddenException(SystemMessage.NOT_ALLOWED_REQUEST);

		const teacher = await this.memberModel
			.findOne({
				_id: teacherId,
				memberType: MemberType.TEACHER,
				memberStatus: MemberStatus.ACTIVE,
			})
			.exec();
		if (!teacher) throw new ForbiddenException(SystemMessage.NOT_ALLOWED_REQUEST);

		const staffRecord = await this.kindergartenStaffModel
			.findOne({
				kindergartenId: child.kindergartenId,
				memberId: teacherId,
				staffStatus: StaffStatus.ACTIVE,
				staffRole: StaffRole.TEACHER,
			})
			.exec();
		if (!staffRecord) throw new ForbiddenException(SystemMessage.NOT_ALLOWED_REQUEST);

		return {
			child,
			group,
			teacherId,
			participantIds: this.uniqueObjectIds([child.parentId, teacherId]),
		};
	}

	private async assertCanAccessApplicationChat(authMember: Member, application: Application): Promise<void> {
		if (authMember.memberType === MemberType.SUPER_ADMIN) return;

		if (authMember.memberType === MemberType.PARENT) {
			if (application.parentId.toString() === authMember._id.toString()) return;
			throw new ForbiddenException(SystemMessage.NOT_ALLOWED_REQUEST);
		}

		if (authMember.memberType === MemberType.KINDERGARTEN_ADMIN) {
			const staffRecord = await this.kindergartenStaffModel
				.findOne({
					kindergartenId: application.kindergartenId,
					memberId: authMember._id,
					staffStatus: StaffStatus.ACTIVE,
					staffRole: { $in: [StaffRole.OWNER, StaffRole.ADMIN] },
				})
				.exec();

			if (staffRecord) return;
			throw new ForbiddenException(SystemMessage.NOT_ALLOWED_REQUEST);
		}

		throw new ForbiddenException(SystemMessage.ONLY_SPECIFIC_ROLES_ALLOWED);
	}

	private async getApplicationParticipantIds(application: Application): Promise<ObjectId[]> {
		const adminStaffRecords = await this.kindergartenStaffModel
			.find({
				kindergartenId: application.kindergartenId,
				staffStatus: StaffStatus.ACTIVE,
				staffRole: { $in: [StaffRole.OWNER, StaffRole.ADMIN] },
			})
			.select('memberId')
			.exec();

		return this.uniqueObjectIds([application.parentId, ...adminStaffRecords.map((staff) => staff.memberId)]);
	}

	private async syncConversationParticipants(
		conversation: Conversation,
		participantIds: ObjectId[],
	): Promise<Conversation> {
		if (this.hasSameObjectIds(conversation.participantIds ?? [], participantIds)) return conversation;

		const result = await this.conversationModel
			.findByIdAndUpdate(conversation._id, { participantIds }, { new: true })
			.exec();
		if (!result) throw new InternalServerErrorException(SystemMessage.UPDATE_FAILED);

		return result;
	}

	private async createNotificationsBestEffort(inputs: NotificationInput[]): Promise<void> {
		for (const input of inputs) {
			try {
				await this.notificationService.createNotification(input);
			} catch (err) {
				console.log('Application chat notification failed:', err.message);
			}
		}
	}

	private async reserveApplicationChatMessageCreatedHooks(
		conversation: Conversation,
		message: ChatMessage,
	): Promise<void> {
		if (!conversation.applicationId) throw new InternalServerErrorException(SystemMessage.NO_DATA_FOUND);

		const application = await this.findApplicationOrFail(conversation.applicationId);
		const participantIds = await this.getApplicationParticipantIds(application);
		const recipientIds = this.uniqueObjectIds(participantIds).filter(
			(memberId) => memberId.toString() !== message.senderId.toString(),
		);

		await this.createNotificationsBestEffort(
			recipientIds.map((recipientId) => ({
				recipientId,
				senderId: message.senderId,
				type: NotificationType.APPLICATION_CHAT_MESSAGE_CREATED,
				title: 'New application chat message',
				message: 'You have a new application chat message.',
				targetType: NotificationTargetType.APPLICATION_CHAT,
				targetId: conversation._id,
				metadata: {
					applicationId: conversation.applicationId.toString(),
					kindergartenId: conversation.kindergartenId.toString(),
				},
			})),
		);
	}

	private async reserveParentTeacherChatMessageCreatedHooks(
		conversation: Conversation,
		message: ChatMessage,
		context: ParentTeacherChatContext,
	): Promise<void> {
		const recipientIds = this.uniqueObjectIds(context.participantIds).filter(
			(memberId) => memberId.toString() !== message.senderId.toString(),
		);

		await this.createNotificationsBestEffort(
			recipientIds.map((recipientId) => ({
				recipientId,
				senderId: message.senderId,
				type: NotificationType.PARENT_TEACHER_CHAT_MESSAGE_CREATED,
				title: 'New parent-teacher message',
				message: 'You have a new parent-teacher chat message.',
				targetType: NotificationTargetType.PARENT_TEACHER_CHAT,
				targetId: conversation._id,
				metadata: {
					conversationId: conversation._id.toString(),
					childId: context.child._id.toString(),
					groupId: context.group._id.toString(),
					kindergartenId: context.child.kindergartenId.toString(),
				},
			})),
		);
	}

	private async publishApplicationChatMessageCreated(
		conversation: Conversation,
		message: ChatMessage,
	): Promise<void> {
		const recipientIds = this.uniqueObjectIds(conversation.participantIds ?? []).filter(
			(memberId) => memberId.toString() !== message.senderId.toString(),
		);
		if (!recipientIds.length) return;

		const published = await this.redisService.publish(RealtimeService.USER_CHANNEL, {
			memberIds: recipientIds.map((memberId) => memberId.toString()),
			eventName: APPLICATION_CHAT_MESSAGE_CREATED_EVENT,
			payload: this.shapeRealtimeMessage(conversation, message),
		});

		if (!published) this.logger.warn(`Application chat realtime publish skipped for ${message._id.toString()}.`);
	}

	private async publishParentTeacherChatMessageCreated(
		conversation: Conversation,
		message: ChatMessage,
	): Promise<void> {
		const recipientIds = this.uniqueObjectIds(conversation.participantIds ?? []).filter(
			(memberId) => memberId.toString() !== message.senderId.toString(),
		);
		if (!recipientIds.length) return;

		const published = await this.redisService.publish(RealtimeService.USER_CHANNEL, {
			memberIds: recipientIds.map((memberId) => memberId.toString()),
			eventName: PARENT_TEACHER_CHAT_MESSAGE_CREATED_EVENT,
			payload: this.shapeParentTeacherRealtimeMessage(conversation, message),
		});

		if (!published) this.logger.warn(`Parent-teacher chat realtime publish skipped for ${message._id.toString()}.`);
	}

	private shapeRealtimeMessage(conversation: Conversation, message: ChatMessage): Record<string, unknown> {
		return {
			_id: message._id.toString(),
			conversationId: message.conversationId.toString(),
			senderId: message.senderId.toString(),
			text: message.text,
			attachments: message.attachments ?? [],
			readBy: (message.readBy ?? []).map((memberId) => memberId.toString()),
			createdAt: message.createdAt,
			conversation: {
				conversationId: conversation._id.toString(),
				applicationId: conversation.applicationId.toString(),
				kindergartenId: conversation.kindergartenId.toString(),
				parentId: conversation.parentId.toString(),
			},
		};
	}

	private shapeParentTeacherRealtimeMessage(conversation: Conversation, message: ChatMessage): Record<string, unknown> {
		return {
			_id: message._id.toString(),
			conversationId: message.conversationId.toString(),
			senderId: message.senderId.toString(),
			text: message.text,
			attachments: message.attachments ?? [],
			readBy: (message.readBy ?? []).map((memberId) => memberId.toString()),
			createdAt: message.createdAt,
			conversation: {
				conversationId: conversation._id.toString(),
				childId: conversation.childId?.toString(),
				groupId: conversation.groupId?.toString(),
				kindergartenId: conversation.kindergartenId.toString(),
				parentId: conversation.parentId.toString(),
				teacherId: conversation.teacherId?.toString(),
			},
		};
	}

	private uniqueObjectIds(ids: ObjectId[]): ObjectId[] {
		const seen = new Set<string>();
		return ids.filter((id) => {
			const key = id.toString();
			if (seen.has(key)) return false;
			seen.add(key);
			return true;
		});
	}

	private hasSameObjectIds(left: ObjectId[], right: ObjectId[]): boolean {
		const leftIds = left.map((id) => id.toString()).sort();
		const rightIds = right.map((id) => id.toString()).sort();
		if (leftIds.length !== rightIds.length) return false;

		return leftIds.every((id, index) => id === rightIds[index]);
	}

	private getErrorMessage(err: unknown): string {
		return err instanceof Error ? err.message : String(err);
	}
}
