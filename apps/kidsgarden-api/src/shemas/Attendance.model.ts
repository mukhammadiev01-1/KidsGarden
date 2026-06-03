import { Schema } from 'mongoose';
import { AttendanceStatus } from '../libs/enums/attendance.enum';

const AttendanceSchema = new Schema(
	{
		childId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Child',
		},

		kindergartenId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Kindergarten',
		},

		groupId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Group',
		},

		attendanceDate: {
			type: Date,
			required: true,
		},

		attendanceStatus: {
			type: String,
			enum: AttendanceStatus,
			required: true,
		},

		markedBy: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Member',
		},

		note: {
			type: String,
		},
	},
	{ timestamps: true, collection: 'attendances' },
);

AttendanceSchema.index({ childId: 1, attendanceDate: 1 }, { unique: true });

export default AttendanceSchema;
