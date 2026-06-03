import { Schema } from 'mongoose';
import { ChildGender, ChildStatus } from '../libs/enums/child.enum';

const ChildSchema = new Schema(
	{
		childFullName: {
			type: String,
			required: true,
		},

		childBirthDate: {
			type: Date,
			required: true,
		},

		childGender: {
			type: String,
			enum: ChildGender,
			required: true,
		},

		childImage: {
			type: String,
			default: '',
		},

		childStatus: {
			type: String,
			enum: ChildStatus,
			default: ChildStatus.ACTIVE,
		},

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

		groupId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Group',
		},
	},
	{ timestamps: true, collection: 'children' },
);

ChildSchema.index(
	{ childFullName: 1, childBirthDate: 1, parentId: 1, kindergartenId: 1, childStatus: 1 },
	{ unique: true, partialFilterExpression: { childStatus: ChildStatus.ACTIVE } },
);

export default ChildSchema;
