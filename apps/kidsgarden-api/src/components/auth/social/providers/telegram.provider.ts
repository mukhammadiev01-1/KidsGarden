import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { createPublicKey, createVerify, JsonWebKey, KeyObject } from 'crypto';
import { NormalizedSocialProfile, SocialProvider } from '../social-auth.types';

interface TelegramJwtHeader {
	alg?: string;
	kid?: string;
	typ?: string;
}

interface TelegramJwtPayload {
	iss?: string;
	aud?: string | string[];
	sub?: string;
	exp?: number;
	iat?: number;
	nonce?: string;
	name?: string;
	preferred_username?: string;
	picture?: string;
}

interface TelegramJwk {
	kid?: string;
	kty?: string;
	use?: string;
	alg?: string;
	n?: string;
	e?: string;
}

@Injectable()
export class TelegramProvider {
	private readonly defaultIssuer = 'https://oauth.telegram.org';
	private readonly defaultJwksUrl = 'https://oauth.telegram.org/.well-known/jwks.json';

	public async verifyIdToken(idToken: string, nonce?: string): Promise<NormalizedSocialProfile> {
		const telegramClientId = process.env.TELEGRAM_CLIENT_ID?.trim();
		if (!telegramClientId) throw new InternalServerErrorException('Telegram login is not configured');

		try {
			const [encodedHeader, encodedPayload, encodedSignature] = idToken.split('.');
			if (!encodedHeader || !encodedPayload || !encodedSignature) {
				throw new BadRequestException('Invalid Telegram token');
			}

			const header = this.decodeJwtPart<TelegramJwtHeader>(encodedHeader);
			const payload = this.decodeJwtPart<TelegramJwtPayload>(encodedPayload);

			if (header.alg !== 'RS256' || !header.kid) throw new BadRequestException('Invalid Telegram token');

			await this.verifySignature({
				encodedHeader,
				encodedPayload,
				encodedSignature,
				keyId: header.kid,
			});
			this.verifyClaims(payload, telegramClientId, nonce);

			return {
				provider: SocialProvider.TELEGRAM,
				providerUserId: payload.sub!,
				emailVerified: false,
				displayName: payload.name || payload.preferred_username,
				avatar: payload.picture,
			};
		} catch (err) {
			if (err instanceof InternalServerErrorException || err instanceof BadRequestException) throw err;
			throw new BadRequestException('Invalid Telegram token');
		}
	}

	private decodeJwtPart<T>(encodedPart: string): T {
		const decodedPart = Buffer.from(encodedPart, 'base64url').toString('utf8');
		return JSON.parse(decodedPart) as T;
	}

	private async verifySignature(input: {
		encodedHeader: string;
		encodedPayload: string;
		encodedSignature: string;
		keyId: string;
	}): Promise<void> {
		const publicKey = await this.getPublicKey(input.keyId);
		const verifier = createVerify('RSA-SHA256');
		verifier.update(`${input.encodedHeader}.${input.encodedPayload}`);
		verifier.end();

		const isValid = verifier.verify(publicKey, Buffer.from(input.encodedSignature, 'base64url'));
		if (!isValid) throw new BadRequestException('Invalid Telegram token');
	}

	private async getPublicKey(keyId: string): Promise<KeyObject> {
		const response = await fetch(this.getJwksUrl());
		if (!response.ok) throw new BadRequestException('Invalid Telegram token');

		const jwks = (await response.json()) as { keys?: TelegramJwk[] };
		const jwk = jwks.keys?.find((key) => key.kid === keyId);
		if (!jwk) throw new BadRequestException('Invalid Telegram token');

		return createPublicKey({ key: jwk as JsonWebKey, format: 'jwk' });
	}

	private verifyClaims(payload: TelegramJwtPayload, clientId: string, nonce?: string): void {
		const now = Math.floor(Date.now() / 1000);
		const audience = Array.isArray(payload.aud) ? payload.aud : [payload.aud];

		if (payload.iss !== this.getIssuer()) throw new BadRequestException('Invalid Telegram token');
		if (!audience.includes(clientId)) throw new BadRequestException('Invalid Telegram token');
		if (!payload.sub) throw new BadRequestException('Invalid Telegram account');
		if (!payload.exp || payload.exp <= now) throw new BadRequestException('Invalid Telegram token');
		if (!payload.iat || payload.iat > now + 300) throw new BadRequestException('Invalid Telegram token');
		if (nonce && payload.nonce !== nonce) throw new BadRequestException('Invalid Telegram token');
	}

	private getIssuer(): string {
		return process.env.TELEGRAM_ISSUER?.trim() || this.defaultIssuer;
	}

	private getJwksUrl(): string {
		return process.env.TELEGRAM_JWKS_URL?.trim() || this.defaultJwksUrl;
	}
}
