import { Schema } from 'mongoose';
import { ConversationType } from '../libs/enums/chat.enum';

const ConversationSchema = new Schema(
	{
		type: {
			type: String,
			enum: ConversationType,
			required: true,
		},

		applicationId: {
			type: Schema.Types.ObjectId,
			required: function () {
				return this.type === ConversationType.APPLICATION_CHAT;
			},
			ref: 'Application',
		},

		kindergartenId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Kindergarten',
		},

		parentId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Member',
		},

		childId: {
			type: Schema.Types.ObjectId,
			required: function () {
				return this.type === ConversationType.PARENT_TEACHER_CHAT;
			},
			ref: 'Child',
		},

		groupId: {
			type: Schema.Types.ObjectId,
			required: function () {
				return this.type === ConversationType.PARENT_TEACHER_CHAT;
			},
			ref: 'Group',
		},

		teacherId: {
			type: Schema.Types.ObjectId,
			required: function () {
				return this.type === ConversationType.PARENT_TEACHER_CHAT;
			},
			ref: 'Member',
		},

		participantIds: {
			type: [
				{
					type: Schema.Types.ObjectId,
					ref: 'Member',
				},
			],
			default: [],
		},

		lastMessage: {
			type: String,
		},

		lastMessageAt: {
			type: Date,
		},
	},
	{ timestamps: true, collection: 'conversations' },
);

ConversationSchema.index(
	{ type: 1, applicationId: 1 },
	{
		unique: true,
		partialFilterExpression: { type: ConversationType.APPLICATION_CHAT },
	},
);
ConversationSchema.index({ applicationId: 1 });
ConversationSchema.index(
	{ type: 1, childId: 1, teacherId: 1 },
	{
		unique: true,
		partialFilterExpression: { type: ConversationType.PARENT_TEACHER_CHAT },
	},
);
ConversationSchema.index({ childId: 1, updatedAt: -1 });
ConversationSchema.index({ teacherId: 1, updatedAt: -1 });
ConversationSchema.index({ participantIds: 1, updatedAt: -1 });
ConversationSchema.index({ kindergartenId: 1, updatedAt: -1 });
ConversationSchema.index({ parentId: 1, updatedAt: -1 });

export default ConversationSchema;
