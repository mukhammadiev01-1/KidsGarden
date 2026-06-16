import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { NormalizedSocialProfile, SocialProvider } from '../social-auth.types';
import { normalizeSocialEmail } from '../social-auth.util';

interface KakaoTokenResponse {
	access_token?: string;
	error?: string;
	error_description?: string;
}

interface KakaoUserResponse {
	id?: number | string;
	code?: number | string;
	msg?: string;
	properties?: {
		nickname?: string;
		profile_image?: string;
		profile_image_url?: string;
	};
	kakao_account?: {
		email?: string;
		is_email_valid?: boolean;
		is_email_verified?: boolean;
		profile?: {
			nickname?: string;
			profile_image_url?: string;
		};
	};
}

@Injectable()
export class KakaoProvider {
	private readonly authorizeTokenUrl = 'https://kauth.kakao.com/oauth/token';
	private readonly userInfoUrl = 'https://kapi.kakao.com/v2/user/me';

	public async verifyAuthorizationCode(code: string, redirectUri: string): Promise<NormalizedSocialProfile> {
		const accessToken = await this.exchangeCodeForAccessToken(code, redirectUri);
		return this.getUserProfile(accessToken);
	}

	private async exchangeCodeForAccessToken(code: string, redirectUri: string): Promise<string> {
		const kakaoRestApiKey = process.env.KAKAO_REST_API_KEY?.trim();
		if (!kakaoRestApiKey) throw new InternalServerErrorException('Kakao login is not configured');
		if (!code?.trim() || !redirectUri?.trim()) throw new BadRequestException('Invalid Kakao login request');

		try {
			const body = new URLSearchParams({
				grant_type: 'authorization_code',
				client_id: kakaoRestApiKey,
				redirect_uri: redirectUri.trim(),
				code: code.trim(),
			});

			const clientSecret = process.env.KAKAO_CLIENT_SECRET?.trim();
			if (clientSecret) body.set('client_secret', clientSecret);

			const response = await fetch(this.authorizeTokenUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
				},
				body,
			});
			const payload = (await response.json()) as KakaoTokenResponse;
			this.logKakaoDiagnostic('token', {
				status: response.status,
				hasAccessToken: Boolean(payload.access_token),
				error: payload.error,
				errorDescription: payload.error_description,
			});

			if (!response.ok || !payload.access_token) {
				if (payload.error === 'invalid_grant') {
					throw new BadRequestException('Kakao authorization code expired or already used. Please try again.');
				}
				throw new BadRequestException('Invalid Kakao authorization code');
			}
			return payload.access_token;
		} catch (err) {
			if (err instanceof InternalServerErrorException || err instanceof BadRequestException) throw err;
			throw new BadRequestException('Invalid Kakao authorization code');
		}
	}

	private async getUserProfile(accessToken: string): Promise<NormalizedSocialProfile> {
		try {
			const response = await fetch(this.userInfoUrl, {
				method: 'GET',
				headers: {
					Authorization: `Bearer ${accessToken}`,
					'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
				},
			});
			const payload = (await response.json()) as KakaoUserResponse;
			this.logKakaoDiagnostic('profile', {
				status: response.status,
				hasId: Boolean(payload.id),
				errorCode: payload.code,
				errorMessage: payload.msg,
			});

			if (!response.ok || !payload.id) throw new BadRequestException('Invalid Kakao account');

			const emailVerified =
				payload.kakao_account?.is_email_valid === true && payload.kakao_account?.is_email_verified === true;

			return {
				provider: SocialProvider.KAKAO,
				providerUserId: String(payload.id),
				email: emailVerified ? normalizeSocialEmail(payload.kakao_account?.email) : undefined,
				emailVerified,
				displayName: payload.kakao_account?.profile?.nickname || payload.properties?.nickname,
				avatar: payload.kakao_account?.profile?.profile_image_url || payload.properties?.profile_image_url || payload.properties?.profile_image,
			};
		} catch (err) {
			if (err instanceof BadRequestException) throw err;
			throw new BadRequestException('Invalid Kakao account');
		}
	}

	private logKakaoDiagnostic(stage: string, info: Record<string, unknown>): void {
		if (process.env.NODE_ENV === 'production') return;
		console.log(`[Kakao Login ${stage}]`, info);
	}
}
