import { BadRequestException, ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId, PipelineStage } from 'mongoose';
import { capPaginationLimit } from '../../libs/config';
import { Direction, Message } from '../../libs/enums/common.enum';
import { MemberStatus, MemberType } from '../../libs/enums/member.enum';
import { NotificationAudience, NotificationType } from '../../libs/enums/notification.enum';
import { Member } from '../../libs/dto/member/member';
import { Notification, Notifications } from '../../libs/dto/notification/notification';
import { NotificationInput, NotificationsInquiry } from '../../libs/dto/notification/notification.input';
import { T } from '../../libs/types/common';
import { RedisService } from '../redis/redis.service';
import { RealtimeService } from '../realtime/realtime.service';

const NOTIFICATION_CREATED_EVENT = 'notification.created';

@Injectable()
export class NotificationService {
	private readonly logger = new Logger(NotificationService.name);
	private readonly notificationListMaxLimit = 100;
	private readonly notificationSortFields = ['createdAt', 'updatedAt', 'isRead'];
	private readonly maxTitleLength = 140;
	private readonly maxMessageLength = 320;
	private readonly maxMetadataLength = 5000;
	private readonly hiddenChatNotificationTypes = [
		NotificationType.APPLICATION_CHAT_MESSAGE_CREATED,
		NotificationType.PARENT_TEACHER_CHAT_MESSAGE_CREATED,
	];

	constructor(
		@InjectModel('Notification') private readonly notificationModel: Model<Notification>,
		@InjectModel('Member') private readonly memberModel: Model<Member>,
		private readonly redisService: RedisService,
	) {}

	public async getMyNotifications(authMember: Member, input: NotificationsInquiry): Promise<Notifications> {
		const match = this.shapeInquiryMatch(authMember, input);
		const sortField = this.notificationSortFields.includes(input?.sort) ? input.sort : 'createdAt';
		const sort: T = { [sortField]: input?.direction ?? Direction.DESC };
		const limit = capPaginationLimit(input.limit, this.notificationListMaxLimit);

		const result = await this.notificationModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [{ $skip: (input.page - 1) * limit }, { $limit: limit }],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();

		return result[0] ?? { list: [], metaCounter: [] };
	}

	public async getMyUnreadNotificationCount(authMember: Member): Promise<number> {
		return await this.notificationModel
			.countDocuments({
				recipientId: authMember._id,
				isRead: false,
				type: { $nin: this.hiddenChatNotificationTypes },
			})
			.exec();
	}

	public async markNotificationRead(authMember: Member, notificationId: ObjectId): Promise<boolean> {
		const result = await this.notificationModel
			.findOneAndUpdate({ _id: notificationId, recipientId: authMember._id }, { isRead: true }, { new: true })
			.exec();
		if (!result) throw new ForbiddenException(Message.NOT_ALLOWED_REQUEST);

		return true;
	}

	public async markAllNotificationsRead(authMember: Member): Promise<boolean> {
		await this.notificationModel
			.updateMany(
				{
					recipientId: authMember._id,
					isRead: false,
					type: { $nin: this.hiddenChatNotificationTypes },
				},
				{ $set: { isRead: true } },
			)
			.exec();

		return true;
	}

	public async createNotification(input: NotificationInput): Promise<Notification> {
		const recipient = await this.memberModel
			.findOne({ _id: input.recipientId, memberStatus: MemberStatus.ACTIVE })
			.exec();
		if (!recipient) throw new BadRequestException(Message.BAD_REQUEST);

		const title = input.title?.trim();
		const message = input.message?.trim();
		const targetId = input.targetId?.toString()?.trim();
		if (!title || !message || !targetId) throw new BadRequestException(Message.BAD_REQUEST);
		if (title.length > this.maxTitleLength || message.length > this.maxMessageLength) {
			throw new BadRequestException(Message.BAD_REQUEST);
		}

		let notification: Notification;
		try {
			notification = await this.notificationModel.create({
				recipientId: recipient._id,
				senderId: input.senderId,
				recipientRole: recipient.memberType,
				audience: this.memberTypeToAudience(recipient.memberType),
				type: input.type,
				title,
				message,
				targetType: input.targetType,
				targetId,
				metadata: this.serializeMetadata(input.metadata),
				isRead: false,
			});
		} catch (err) {
			throw new BadRequestException(Message.CREATE_FAILED);
		}

		void this.publishNotificationCreated(notification).catch((err) => {
			this.logger.warn(`Realtime notification publish failed: ${this.getErrorMessage(err)}`);
		});

		return notification;
	}

	public async createNotificationsForRecipients(inputs: NotificationInput[]): Promise<Notification[]> {
		const notifications: Notification[] = [];

		for (const input of inputs) {
			notifications.push(await this.createNotification(input));
		}

		return notifications;
	}

	public async notifyKindergartenApplicationCreated(): Promise<void> {
		return;
	}

	public async notifyKindergartenApplicationStatusUpdated(): Promise<void> {
		return;
	}

	public async notifyApplicationChatMessageCreated(): Promise<void> {
		return;
	}

	public async notifyTeacherApplicationCreated(): Promise<void> {
		return;
	}

	public async notifyTeacherApplicationStatusUpdated(): Promise<void> {
		return;
	}

	public async notifyKindergartenAdminApplicationCreated(): Promise<void> {
		return;
	}

	public async notifyKindergartenAdminApplicationStatusUpdated(): Promise<void> {
		return;
	}

	public async notifyCommentReplied(): Promise<void> {
		return;
	}

	public async notifyCommentLiked(): Promise<void> {
		return;
	}

	public async notifyAnnouncementCreated(): Promise<void> {
		return;
	}

	private shapeInquiryMatch(authMember: Member, input: NotificationsInquiry): PipelineStage.Match['$match'] {
		const match: T = { recipientId: authMember._id };
		const { isRead, type, targetType, targetId } = input.search ?? {};

		if (isRead !== undefined) match.isRead = isRead;
		this.applyVisibleNotificationTypeFilter(match, type);
		if (targetType) match.targetType = targetType;
		if (targetId?.trim()) match.targetId = targetId.trim();

		return match;
	}

	private applyVisibleNotificationTypeFilter(match: T, type?: NotificationType): void {
		if (type) {
			match.type = this.hiddenChatNotificationTypes.includes(type) ? { $in: [] } : type;
			return;
		}

		match.type = { $nin: this.hiddenChatNotificationTypes };
	}

	private memberTypeToAudience(memberType: MemberType): NotificationAudience {
		switch (memberType) {
			case MemberType.TEACHER:
				return NotificationAudience.TEACHER;
			case MemberType.KINDERGARTEN_ADMIN:
				return NotificationAudience.KINDERGARTEN_ADMIN;
			case MemberType.SUPER_ADMIN:
				return NotificationAudience.SUPER_ADMIN;
			case MemberType.PARENT:
			default:
				return NotificationAudience.PARENT;
		}
	}

	private serializeMetadata(metadata?: Record<string, unknown> | string): string | undefined {
		if (metadata === undefined || metadata === null) return undefined;

		const value = typeof metadata === 'string' ? metadata : JSON.stringify(metadata);
		if (value.length > this.maxMetadataLength) throw new BadRequestException(Message.BAD_REQUEST);

		return value;
	}

	private async publishNotificationCreated(notification: Notification): Promise<void> {
		const published = await this.redisService.publish(RealtimeService.USER_CHANNEL, {
			memberId: notification.recipientId.toString(),
			eventName: NOTIFICATION_CREATED_EVENT,
			payload: this.shapeRealtimeNotification(notification),
		});

		if (!published) this.logger.warn(`Realtime notification publish skipped for ${notification._id.toString()}.`);
	}

	private shapeRealtimeNotification(notification: Notification): Record<string, unknown> {
		return {
			_id: notification._id.toString(),
			recipientId: notification.recipientId.toString(),
			senderId: notification.senderId?.toString(),
			type: notification.type,
			audience: notification.audience,
			title: notification.title,
			message: notification.message,
			targetType: notification.targetType,
			targetId: notification.targetId,
			metadata: notification.metadata,
			isRead: notification.isRead,
			createdAt: notification.createdAt,
		};
	}

	private getErrorMessage(err: unknown): string {
		return err instanceof Error ? err.message : String(err);
	}
}
