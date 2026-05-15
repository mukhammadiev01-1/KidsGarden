import { Schema } from 'mongoose';
import { StaffRole } from '../libs/enums/kindergarten-staff.enum';
import { StaffApplicationStatus } from '../libs/enums/staff-application.enum';

const StaffApplicationSchema = new Schema(
	{
		kindergartenId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Kindergarten',
		},

		applicantId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Member',
		},

		requestedRole: {
			type: String,
			enum: StaffRole,
			required: true,
		},

		applicationStatus: {
			type: String,
			enum: StaffApplicationStatus,
			default: StaffApplicationStatus.PENDING,
		},

		message: {
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
	{ timestamps: true, collection: 'staffApplications' },
);

StaffApplicationSchema.index(
	{ kindergartenId: 1, applicantId: 1, applicationStatus: 1 },
	{ unique: true, partialFilterExpression: { applicationStatus: StaffApplicationStatus.PENDING } },
);

export default StaffApplicationSchema;
