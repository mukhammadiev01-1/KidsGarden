import { Schema } from 'mongoose';
import { NotificationAudience, NotificationTargetType, NotificationType } from '../libs/enums/notification.enum';
import { MemberType } from '../libs/enums/member.enum';

const NotificationSchema = new Schema(
	{
		recipientId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Member',
		},

		senderId: {
			type: Schema.Types.ObjectId,
			ref: 'Member',
		},

		recipientRole: {
			type: String,
			enum: MemberType,
		},

		type: {
			type: String,
			enum: NotificationType,
			required: true,
		},

		audience: {
			type: String,
			enum: NotificationAudience,
			required: true,
		},

		title: {
			type: String,
			required: true,
			trim: true,
		},

		message: {
			type: String,
			required: true,
			trim: true,
		},

		targetType: {
			type: String,
			enum: NotificationTargetType,
			required: true,
		},

		targetId: {
			type: String,
			required: true,
			trim: true,
		},

		metadata: {
			type: String,
		},

		isRead: {
			type: Boolean,
			default: false,
		},
	},
	{ timestamps: true, collection: 'notifications' },
);

NotificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ recipientId: 1, createdAt: -1 });
NotificationSchema.index({ type: 1, targetType: 1, targetId: 1 });

export default NotificationSchema;
