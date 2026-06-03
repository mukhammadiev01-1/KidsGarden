import { Schema } from 'mongoose';
import { ApplicationStatus } from '../libs/enums/application.enum';

export const OPEN_APPLICATION_STATUSES = [
	ApplicationStatus.PENDING,
	ApplicationStatus.REVIEWING,
	ApplicationStatus.NEED_MORE_INFO,
];

const ApplicationSchema = new Schema(
	{
		parentId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Member',
		},

		kindergartenId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Kindergarten',
		},

		kindergartenOwnerId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Member',
		},

		childName: {
			type: String,
			required: true,
		},

		childAge: {
			type: Number,
			required: true,
		},

		parentMessage: {
			type: String,
		},

		documents: {
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

		adminNote: {
			type: String,
		},

		status: {
			type: String,
			enum: ApplicationStatus,
			default: ApplicationStatus.PENDING,
		},

		reviewedBy: {
			type: Schema.Types.ObjectId,
			ref: 'Member',
		},

		reviewedAt: {
			type: Date,
		},

		canceledAt: {
			type: Date,
		},
	},
	{ timestamps: true, collection: 'applications' },
);

ApplicationSchema.index({ parentId: 1, createdAt: -1 });
ApplicationSchema.index({ kindergartenId: 1, status: 1, createdAt: -1 });
ApplicationSchema.index({ kindergartenOwnerId: 1, status: 1, createdAt: -1 });
ApplicationSchema.index({ status: 1, createdAt: -1 });
ApplicationSchema.index(
	{ parentId: 1, kindergartenId: 1 },
	{
		unique: true,
		partialFilterExpression: { status: { $in: OPEN_APPLICATION_STATUSES } },
	},
);

export default ApplicationSchema;
