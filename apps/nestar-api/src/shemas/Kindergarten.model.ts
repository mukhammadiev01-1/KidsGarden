import { Schema } from 'mongoose';
import { KindergartenLocation, KindergartenStatus, KindergartenType } from '../libs/enums/kindergarten.enum';

const KindergartenSchema = new Schema(
	{
		kindergartenType: {
			type: String,
			enum: KindergartenType,
			required: true,
		},

		kindergartenStatus: {
			type: String,
			enum: KindergartenStatus,
			default: KindergartenStatus.ACTIVE,
		},

		kindergartenLocation: {
			type: String,
			enum: KindergartenLocation,
			required: true,
		},

		kindergartenAddress: {
			type: String,
			required: true,
		},

		kindergartenTitle: {
			type: String,
			required: true,
		},

		kindergartenPrice: {
			type: Number,
			required: true,
		},

		kindergartenCapacity: {
			type: Number,
			required: true,
		},

		kindergartenAgeRange: {
			type: Number,
			required: true,
		},

		kindergartenPrograms: {
			type: Number,
			required: true,
		},

		kindergartenViews: {
			type: Number,
			default: 0,
		},

		kindergartenLikes: {
			type: Number,
			default: 0,
		},

		kindergartenComments: {
			type: Number,
			default: 0,
		},

		kindergartenRank: {
			type: Number,
			default: 0,
		},

		kindergartenImages: {
			type: [String],
			required: true,
		},

		kindergartenDesc: {
			type: String,
		},

		memberId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Member',
		},

		deletedAt: {
			type: Date,
		},

		establishedAt: {
			type: Date,
		},
	},
	{ timestamps: true, collection: 'kindergartens' },
);

KindergartenSchema.index({ kindergartenType: 1, kindergartenLocation: 1, kindergartenTitle: 1, kindergartenPrice: 1 }, { unique: true });

export default KindergartenSchema;
