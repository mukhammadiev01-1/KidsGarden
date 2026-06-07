import { Schema } from 'mongoose';

const MessageSchema = new Schema(
	{
		conversationId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Conversation',
		},

		senderId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Member',
		},

		text: {
			type: String,
		},

		attachments: {
			type: [
				{
					url: {
						type: String,
						required: true,
					},
					name: {
						type: String,
						required: true,
					},
					mimeType: {
						type: String,
						required: true,
					},
					size: {
						type: Number,
						required: true,
					},
				},
			],
			default: [],
		},

		readBy: {
			type: [
				{
					type: Schema.Types.ObjectId,
					ref: 'Member',
				},
			],
			default: [],
		},
	},
	{ timestamps: true, collection: 'messages' },
);

MessageSchema.index({ conversationId: 1, createdAt: -1 });
MessageSchema.index({ senderId: 1, createdAt: -1 });

export default MessageSchema;
