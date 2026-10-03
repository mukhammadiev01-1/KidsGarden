import { Schema } from 'mongoose';

/**
 * Short-lived, single-use codes that hand a website login over to the mobile
 * app (social login runs on the website, in the phone's in-app browser).
 * Only a hash of the code is stored; MongoDB removes expired rows itself.
 */
const AppLoginCodeSchema = new Schema(
	{
		codeHash: {
			type: String,
			required: true,
		},

		memberId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Member',
		},

		// SHA-256 of a secret only the app that started the login knows (PKCE).
		challenge: {
			type: String,
			required: true,
		},

		expiresAt: {
			type: Date,
			required: true,
		},
	},
	{ timestamps: true, collection: 'appLoginCodes' },
);

AppLoginCodeSchema.index({ codeHash: 1 }, { unique: true });
AppLoginCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default AppLoginCodeSchema;
