export enum SocialProvider {
	GOOGLE = 'GOOGLE',
	TELEGRAM = 'TELEGRAM',
}

export interface NormalizedSocialProfile {
	provider: SocialProvider;
	providerUserId: string;
	email?: string;
	emailVerified?: boolean;
	displayName?: string;
	avatar?: string;
}

export type VerifiedSocialAccount = NormalizedSocialProfile;
