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
			required: true,
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
ConversationSchema.index({ participantIds: 1, updatedAt: -1 });
ConversationSchema.index({ kindergartenId: 1, updatedAt: -1 });
ConversationSchema.index({ parentId: 1, updatedAt: -1 });

export default ConversationSchema;
