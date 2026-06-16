import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { createHash, createHmac, timingSafeEqual } from 'crypto';
import { TelegramLoginInput } from '../../../../libs/dto/member/member.input';
import { NormalizedSocialProfile, SocialProvider } from '../social-auth.types';

@Injectable()
export class TelegramProvider {
	private readonly maxAuthAgeSeconds = 24 * 60 * 60;

	public verifyLoginWidgetAuth(input: TelegramLoginInput): NormalizedSocialProfile {
		const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim() || process.env.TELEGRAM_CLIENT_SECRET?.trim();
		if (!botToken) throw new InternalServerErrorException('Telegram login is not configured');

		try {
			this.logTelegramDiagnostic('classic-widget', {
				callbackKeys: this.getSafeCallbackKeys(input),
			});

			this.validateAuthDataShape(input);
			this.validateAuthDate(input.authDate);
			this.validateHash(input, botToken);

			this.logTelegramDiagnostic('verification', { success: true });

			return {
				provider: SocialProvider.TELEGRAM,
				providerUserId: String(input.id),
				emailVerified: false,
				displayName: [input.firstName, input.lastName].filter(Boolean).join(' ') || input.username,
				avatar: input.photoUrl,
			};
		} catch (err) {
			if (err instanceof InternalServerErrorException || err instanceof BadRequestException) {
				this.logTelegramDiagnostic('verification', {
					success: false,
					reason: err.message,
				});
				throw err;
			}
			this.logTelegramDiagnostic('verification', {
				success: false,
				reason: 'Invalid Telegram auth data',
			});
			throw new BadRequestException('Invalid Telegram auth data');
		}
	}

	private validateAuthDataShape(input: TelegramLoginInput): void {
		if (!input.id?.trim()) throw new BadRequestException('Invalid Telegram account');
		if (!input.hash?.trim()) throw new BadRequestException('Invalid Telegram auth data');
		if (!Number.isFinite(Number(input.authDate))) throw new BadRequestException('Invalid Telegram auth data');
	}

	private validateAuthDate(authDate: number): void {
		const now = Math.floor(Date.now() / 1000);
		const authTimestamp = Number(authDate);

		if (authTimestamp > now + 300) throw new BadRequestException('Invalid Telegram auth data');
		if (now - authTimestamp > this.maxAuthAgeSeconds) {
			throw new BadRequestException('Telegram authorization expired. Please try again.');
		}
	}

	private validateHash(input: TelegramLoginInput, botToken: string): void {
		const dataCheckString = this.buildDataCheckString(input);
		const secretKey = createHash('sha256').update(botToken).digest();
		const computedHash = createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
		const providedHash = input.hash.trim();

		const computedBuffer = Buffer.from(computedHash, 'hex');
		const providedBuffer = Buffer.from(providedHash, 'hex');

		if (computedBuffer.length !== providedBuffer.length || !timingSafeEqual(computedBuffer, providedBuffer)) {
			throw new BadRequestException('Invalid Telegram auth data');
		}
	}

	private buildDataCheckString(input: TelegramLoginInput): string {
		const authData: Record<string, string> = {
			auth_date: String(input.authDate),
			id: String(input.id),
		};

		if (input.firstName) authData.first_name = input.firstName;
		if (input.lastName) authData.last_name = input.lastName;
		if (input.username) authData.username = input.username;
		if (input.photoUrl) authData.photo_url = input.photoUrl;

		return Object.keys(authData)
			.sort()
			.map((key) => `${key}=${authData[key]}`)
			.join('\n');
	}

	private getSafeCallbackKeys(input: TelegramLoginInput): string[] {
		return Object.keys(input).filter((key) => key !== 'hash');
	}

	private logTelegramDiagnostic(stage: string, info: Record<string, unknown>): void {
		if (process.env.NODE_ENV === 'production') return;
		console.log(`[Telegram Login ${stage}]`, info);
	}
}
