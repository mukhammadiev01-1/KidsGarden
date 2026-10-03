import { Schema } from 'mongoose';

/**
 * One row per installed app that agreed to receive push notifications.
 * The Expo push token identifies the install, so it is unique: when another
 * member signs in on the same phone the row moves to them.
 */
const PushDeviceSchema = new Schema(
	{
		memberId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Member',
		},

		token: {
			type: String,
			required: true,
		},

		platform: {
			type: String,
			enum: ['ios', 'android'],
			required: true,
		},

		lastSeenAt: {
			type: Date,
			default: Date.now,
		},
	},
	{ timestamps: true, collection: 'pushDevices' },
);

PushDeviceSchema.index({ token: 1 }, { unique: true });
PushDeviceSchema.index({ memberId: 1, lastSeenAt: -1 });

export default PushDeviceSchema;
