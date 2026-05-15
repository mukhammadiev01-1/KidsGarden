import { Schema } from 'mongoose';
import { KindergartenAdminApplicationStatus } from '../libs/enums/kindergarten-admin-application.enum';

const KindergartenAdminApplicationSchema = new Schema(
	{
		applicantId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Member',
		},

		applicationStatus: {
			type: String,
			enum: KindergartenAdminApplicationStatus,
			default: KindergartenAdminApplicationStatus.PENDING,
		},

		message: {
			type: String,
		},

		kindergartenTitle: {
			type: String,
		},

		kindergartenAddress: {
			type: String,
		},

		kindergartenPhone: {
			type: String,
		},

		businessInfo: {
			type: String,
		},

		reviewedBy: {
			type: Schema.Types.ObjectId,
			ref: 'Member',
		},

		reviewedAt: {
			type: Date,
		},

		rejectReason: {
			type: String,
		},
	},
	{ timestamps: true, collection: 'kindergartenAdminApplications' },
);

KindergartenAdminApplicationSchema.index(
	{ applicantId: 1, applicationStatus: 1 },
	{ unique: true, partialFilterExpression: { applicationStatus: KindergartenAdminApplicationStatus.PENDING } },
);

export default KindergartenAdminApplicationSchema;
