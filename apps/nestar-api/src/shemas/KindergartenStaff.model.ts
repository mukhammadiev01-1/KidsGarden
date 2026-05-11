import { Schema } from 'mongoose';
import { StaffRole, StaffStatus } from '../libs/enums/kindergarten-staff.enum';

const KindergartenStaffSchema = new Schema(
	{
		kindergartenId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Kindergarten',
		},

		memberId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Member',
		},

		staffRole: {
			type: String,
			enum: StaffRole,
			required: true,
		},

		staffStatus: {
			type: String,
			enum: StaffStatus,
			default: StaffStatus.PENDING,
		},
	},
	{ timestamps: true, collection: 'kindergartenStaffs' },
);

KindergartenStaffSchema.index({ kindergartenId: 1, memberId: 1 }, { unique: true });

export default KindergartenStaffSchema;
