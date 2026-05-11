import { Schema } from 'mongoose';
import { GroupStatus } from '../libs/enums/group.enum';

const GroupSchema = new Schema(
	{
		kindergartenId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Kindergarten',
		},

		groupName: {
			type: String,
			required: true,
		},

		groupAgeRange: {
			type: String,
			required: true,
		},

		groupCapacity: {
			type: Number,
			required: true,
		},

		teacherIds: {
			type: [Schema.Types.ObjectId],
			default: [],
			ref: 'Member',
		},

		groupStatus: {
			type: String,
			enum: GroupStatus,
			default: GroupStatus.ACTIVE,
		},
	},
	{ timestamps: true, collection: 'groups' },
);

GroupSchema.index({ kindergartenId: 1, groupName: 1 }, { unique: true });

export default GroupSchema;
