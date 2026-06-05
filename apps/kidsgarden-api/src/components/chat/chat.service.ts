import { BadRequestException, ForbiddenException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId, PipelineStage } from 'mongoose';
import { Application } from '../../libs/dto/application/application';
import { Conversation } from '../../libs/dto/conversation/conversation';
import { Message as ChatMessage, Messages } from '../../libs/dto/message/message';
import { MessagesInquiry, SendMessageInput } from '../../libs/dto/message/message.input';
import { KindergartenStaff } from '../../libs/dto/kindergarten-staff/kindergarten-staff';
import { Member } from '../../libs/dto/member/member';
import { ConversationType } from '../../libs/enums/chat.enum';
import { Direction, Message as SystemMessage } from '../../libs/enums/common.enum';
import { StaffRole, StaffStatus } from '../../libs/enums/kindergarten-staff.enum';
import { MemberType } from '../../libs/enums/member.enum';
import { NotificationTargetType, NotificationType } from '../../libs/enums/notification.enum';
import { capPaginationLimit } from '../../libs/config';
import { T } from '../../libs/types/common';
import { NotificationInput } from '../../libs/dto/notification/notification.input';
import { NotificationService } from '../notification/notification.service';
import { RedisService } from '../redis/redis.service';
import { RealtimeService } from '../realtime/realtime.service';

const APPLICATION_CHAT_MESSAGE_CREATED_EVENT = 'application_chat.message.created';

@Injectable()
export class ChatService {
	private readonly logger = new Logger(ChatService.name);
	private readonly messagesListMaxLimit = 100;
	private readonly maxMessageLength = 2000;
	private readonly messageSortFields = ['createdAt', 'updatedAt'];

	constructor(
		@InjectModel('Application') private readonly applicationModel: Model<Application>,
		@InjectModel('Conversation') private readonly conversationModel: Model<Conversation>,
		@InjectModel('KindergartenStaff') private readonly kindergartenStaffModel: Model<KindergartenStaff>,
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
		const conversation = await this.findConversationOrFail(conversationId);
		await this.assertCanAccessConversation(authMember, conversation);

		const application = await this.findApplicationOrFail(conversation.applicationId);
		const participantIds = await this.getApplicationParticipantIds(application);
		return await this.syncConversationParticipants(conversation, participantIds);
	}

	public async getMessages(authMember: Member, input: MessagesInquiry): Promise<Messages> {
		const conversation = await this.findConversationOrFail(input.search.conversationId);
		await this.assertCanAccessConversation(authMember, conversation);

		const sortField = this.messageSortFields.includes(input?.sort) ? input.sort : 'createdAt';
		const sort: T = { [sortField]: input?.direction ?? Direction.DESC };
		const limit = capPaginationLimit(input.limit, this.messagesListMaxLimit);
		const listPipeline: PipelineStage.FacetPipelineStage[] = [
			{ $skip: (input.page - 1) * limit },
			{ $limit: limit },
		];

		const result = await this.messageModel
			.aggregate([
				{ $match: { conversationId: conversation._id } },
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

	public async sendMessage(authMember: Member, input: SendMessageInput): Promise<ChatMessage> {
		const conversation = await this.findConversationOrFail(input.conversationId);
		await this.assertCanAccessConversation(authMember, conversation);

		const text = input.text?.trim();
		if (!text || text.length > this.maxMessageLength) throw new BadRequestException(SystemMessage.BAD_REQUEST);

		try {
			const message = await this.messageModel.create({
				conversationId: conversation._id,
				senderId: authMember._id,
				text,
				readBy: [authMember._id],
			});

			await this.conversationModel
				.findByIdAndUpdate(conversation._id, {
					lastMessage: text,
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
		const conversation = await this.findConversationOrFail(conversationId);
		await this.assertCanAccessConversation(authMember, conversation);

		await this.messageModel
			.updateMany(
				{
					conversationId: conversation._id,
					readBy: { $ne: authMember._id },
				},
				{ $addToSet: { readBy: authMember._id } },
			)
			.exec();

		return true;
	}

	private async findApplicationOrFail(applicationId: ObjectId): Promise<Application> {
		const application = await this.applicationModel.findById(applicationId).exec();
		if (!application) throw new InternalServerErrorException(SystemMessage.NO_DATA_FOUND);

		return application;
	}

	private async findConversationOrFail(conversationId: ObjectId): Promise<Conversation> {
		const conversation = await this.conversationModel.findById(conversationId).exec();
		if (!conversation || conversation.type !== ConversationType.APPLICATION_CHAT) {
			throw new InternalServerErrorException(SystemMessage.NO_DATA_FOUND);
		}

		return conversation;
	}

	private async assertCanAccessConversation(authMember: Member, conversation: Conversation): Promise<void> {
		const application = await this.findApplicationOrFail(conversation.applicationId);
		await this.assertCanAccessApplicationChat(authMember, application);
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

	private shapeRealtimeMessage(conversation: Conversation, message: ChatMessage): Record<string, unknown> {
		return {
			_id: message._id.toString(),
			conversationId: message.conversationId.toString(),
			senderId: message.senderId.toString(),
			text: message.text,
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
