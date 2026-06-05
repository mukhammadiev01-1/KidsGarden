import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import { NormalizedSocialProfile, SocialProvider } from '../social-auth.types';
import { normalizeSocialEmail } from '../social-auth.util';

@Injectable()
export class GoogleProvider {
	private readonly googleClient = new OAuth2Client();

	public async verifyIdToken(idToken: string): Promise<NormalizedSocialProfile> {
		const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim();
		if (!googleClientId) throw new InternalServerErrorException('Google login is not configured');

		try {
			const ticket = await this.googleClient.verifyIdToken({
				idToken,
				audience: googleClientId,
			});
			const payload = ticket.getPayload();

			if (!payload?.sub || !payload.email || payload.email_verified !== true) {
				throw new BadRequestException('Invalid Google account');
			}

			return {
				provider: SocialProvider.GOOGLE,
				providerUserId: payload.sub,
				email: normalizeSocialEmail(payload.email),
				emailVerified: payload.email_verified === true,
				displayName: payload.name,
				avatar: payload.picture,
			};
		} catch (err) {
			if (err instanceof InternalServerErrorException || err instanceof BadRequestException) throw err;
			throw new BadRequestException('Invalid Google token');
		}
	}
}
