import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Member } from '../../../libs/dto/member/member';
import { GoogleLoginInput, KakaoLoginInput, TelegramLoginInput } from '../../../libs/dto/member/member.input';
import { Message } from '../../../libs/enums/common.enum';
import { KakaoAuthIntent, MemberAuthType, MemberStatus, MemberType, TelegramAuthIntent } from '../../../libs/enums/member.enum';
import { AuthService } from '../auth.service';
import { GoogleProvider } from './providers/google.provider';
import { KakaoProvider } from './providers/kakao.provider';
import { TelegramProvider } from './providers/telegram.provider';
import { NormalizedSocialProfile, SocialProvider } from './social-auth.types';
import {
	buildPrivateSocialMemberNick,
	buildPrivateSocialMemberPhone,
	buildSocialMemberNick,
	buildSocialMemberPhone,
	buildSocialPasswordSeed,
} from './social-auth.util';

@Injectable()
export class SocialAuthService {
	constructor(
		@InjectModel('Member') private readonly memberModel: Model<Member>,
		private readonly authService: AuthService,
		private readonly googleProvider: GoogleProvider,
		private readonly telegramProvider: TelegramProvider,
		private readonly kakaoProvider: KakaoProvider,
	) {}

	public async googleLogin(input: GoogleLoginInput): Promise<Member> {
		const profile = await this.googleProvider.verifyIdToken(input.idToken);
		return this.loginWithGoogleProfile(profile);
	}

	public async telegramLogin(input: TelegramLoginInput): Promise<Member> {
		const profile = this.telegramProvider.verifyLoginWidgetAuth(input);
		return this.loginWithTelegramProfile(profile, input.intent);
	}

	public async kakaoLogin(input: KakaoLoginInput): Promise<Member> {
		const profile = await this.kakaoProvider.verifyAuthorizationCode(input.code, input.redirectUri);
		return this.loginWithKakaoProfile(profile, input.intent);
	}

	private async loginWithGoogleProfile(profile: NormalizedSocialProfile): Promise<Member> {
		if (profile.provider !== SocialProvider.GOOGLE) throw new BadRequestException(Message.BAD_REQUEST);

		let member = await this.memberModel.findOne({ googleId: profile.providerUserId }).select('+googleId').exec();

		if (!member && profile.emailVerified && profile.email) {
			member = await this.memberModel.findOne({ memberEmail: profile.email }).select('+googleId').exec();
		}

		if (member) return this.loginExistingGoogleMember(member, profile);

		return this.createGoogleParentMember(profile);
	}

	private async loginWithTelegramProfile(profile: NormalizedSocialProfile, intent: TelegramAuthIntent): Promise<Member> {
		if (profile.provider !== SocialProvider.TELEGRAM) throw new BadRequestException(Message.BAD_REQUEST);
		if (![TelegramAuthIntent.LOGIN, TelegramAuthIntent.SIGNUP].includes(intent)) {
			throw new BadRequestException(Message.BAD_REQUEST);
		}

		const member = await this.memberModel.findOne({ telegramId: profile.providerUserId }).select('+telegramId').exec();

		if (member) return this.loginExistingTelegramMember(member);
		if (intent === TelegramAuthIntent.LOGIN) {
			throw new BadRequestException('Telegram account not found. Please sign up first.');
		}

		return this.createTelegramParentMember(profile);
	}

	private async loginWithKakaoProfile(profile: NormalizedSocialProfile, intent: KakaoAuthIntent): Promise<Member> {
		if (profile.provider !== SocialProvider.KAKAO) throw new BadRequestException(Message.BAD_REQUEST);
		if (![KakaoAuthIntent.LOGIN, KakaoAuthIntent.SIGNUP].includes(intent)) {
			throw new BadRequestException(Message.BAD_REQUEST);
		}

		let member = await this.memberModel.findOne({ kakaoId: profile.providerUserId }).select('+kakaoId').exec();

		if (!member && profile.emailVerified && profile.email) {
			member = await this.memberModel.findOne({ memberEmail: profile.email }).select('+kakaoId').exec();
		}

		if (member) return this.loginExistingKakaoMember(member, profile);
		if (intent === KakaoAuthIntent.LOGIN) {
			throw new BadRequestException('Kakao account not found. Please sign up first.');
		}

		return this.createKakaoParentMember(profile);
	}

	private async loginExistingGoogleMember(member: Member, profile: NormalizedSocialProfile): Promise<Member> {
		this.assertSocialMemberCanLogin(member);

		if (!member.googleId) {
			const linkedMember = await this.memberModel
				.findOneAndUpdate(
					{
						_id: member._id,
						$or: [{ googleId: { $exists: false } }, { googleId: null }, { googleId: '' }],
					},
					{ $set: { googleId: profile.providerUserId, memberEmail: profile.email } },
					{ new: true },
				)
				.select('+googleId')
				.exec();

			if (!linkedMember) throw new BadRequestException(Message.BAD_REQUEST);
			member = linkedMember;
		}

		member.accessToken = await this.authService.createToken(member);
		return member;
	}

	private async loginExistingTelegramMember(member: Member): Promise<Member> {
		this.assertSocialMemberCanLogin(member);
		member.accessToken = await this.authService.createToken(member);
		return member;
	}

	private async loginExistingKakaoMember(member: Member, profile: NormalizedSocialProfile): Promise<Member> {
		this.assertSocialMemberCanLogin(member);

		if (!member.kakaoId) {
			const linkedMember = await this.memberModel
				.findOneAndUpdate(
					{
						_id: member._id,
						$or: [{ kakaoId: { $exists: false } }, { kakaoId: null }, { kakaoId: '' }],
					},
					{ $set: { kakaoId: profile.providerUserId, ...(profile.email ? { memberEmail: profile.email } : {}) } },
					{ new: true },
				)
				.select('+kakaoId')
				.exec();

			if (!linkedMember) throw new BadRequestException(Message.BAD_REQUEST);
			member = linkedMember;
		}

		member.accessToken = await this.authService.createToken(member);
		return member;
	}

	private async createGoogleParentMember(profile: NormalizedSocialProfile): Promise<Member> {
		const generatedMember = {
			memberType: MemberType.PARENT,
			memberStatus: MemberStatus.ACTIVE,
			memberAuthType: MemberAuthType.GOOGLE,
			memberEmail: profile.email,
			googleId: profile.providerUserId,
			memberPhone: await this.buildUniqueSocialMemberPhone(profile),
			memberNick: await this.buildUniqueSocialMemberNick(profile),
			memberPassword: await this.authService.hashPassword(buildSocialPasswordSeed(profile)),
			memberFullName: profile.displayName,
			memberImage: profile.avatar ?? '',
		};

		try {
			const result = await this.memberModel.create(generatedMember);
			result.accessToken = await this.authService.createToken(result);
			return result;
		} catch (err) {
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}

	private async createTelegramParentMember(profile: NormalizedSocialProfile): Promise<Member> {
		const generatedMember = {
			memberType: MemberType.PARENT,
			memberStatus: MemberStatus.ACTIVE,
			memberAuthType: MemberAuthType.TELEGRAM,
			telegramId: profile.providerUserId,
			memberPhone: await this.buildUniqueTelegramMemberPhone(profile),
			memberNick: await this.buildUniqueTelegramMemberNick(profile),
			memberPassword: await this.authService.hashPassword(buildSocialPasswordSeed(profile)),
			memberFullName: profile.displayName,
			memberImage: profile.avatar ?? '',
		};

		try {
			const result = await this.memberModel.create(generatedMember);
			result.accessToken = await this.authService.createToken(result);
			return result;
		} catch (err) {
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}

	private async createKakaoParentMember(profile: NormalizedSocialProfile): Promise<Member> {
		const generatedMember = {
			memberType: MemberType.PARENT,
			memberStatus: MemberStatus.ACTIVE,
			memberAuthType: MemberAuthType.KAKAO,
			...(profile.email ? { memberEmail: profile.email } : {}),
			kakaoId: profile.providerUserId,
			memberPhone: await this.buildUniqueKakaoMemberPhone(profile),
			memberNick: await this.buildUniqueKakaoMemberNick(profile),
			memberPassword: await this.authService.hashPassword(buildSocialPasswordSeed(profile)),
			memberFullName: profile.displayName,
			memberImage: profile.avatar ?? '',
		};

		try {
			const result = await this.memberModel.create(generatedMember);
			result.accessToken = await this.authService.createToken(result);
			return result;
		} catch (err) {
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}

	private assertSocialMemberCanLogin(member: Member): void {
		if (member.memberStatus === MemberStatus.DELETE) {
			throw new InternalServerErrorException(Message.NO_MEMBER_NICK);
		}
		if (member.memberStatus === MemberStatus.BLOCK) {
			throw new InternalServerErrorException(Message.BLOCKED_USER);
		}
	}

	private async buildUniqueSocialMemberNick(profile: NormalizedSocialProfile): Promise<string> {
		for (let attempt = 0; attempt < 10; attempt++) {
			const candidate = buildSocialMemberNick(profile, attempt);
			const existingMember = await this.memberModel.exists({ memberNick: candidate }).exec();
			if (!existingMember) return candidate;
		}

		throw new BadRequestException(Message.CREATE_FAILED);
	}

	private async buildUniqueSocialMemberPhone(profile: NormalizedSocialProfile): Promise<string> {
		for (let attempt = 0; attempt < 10; attempt++) {
			const candidate = buildSocialMemberPhone(profile, attempt);
			const existingMember = await this.memberModel.exists({ memberPhone: candidate }).exec();
			if (!existingMember) return candidate;
		}

		throw new BadRequestException(Message.CREATE_FAILED);
	}

	private async buildUniqueTelegramMemberNick(profile: NormalizedSocialProfile): Promise<string> {
		for (let attempt = 0; attempt < 10; attempt++) {
			const candidate = buildPrivateSocialMemberNick(profile, attempt);
			const existingMember = await this.memberModel.exists({ memberNick: candidate }).exec();
			if (!existingMember) return candidate;
		}

		throw new BadRequestException(Message.CREATE_FAILED);
	}

	private async buildUniqueTelegramMemberPhone(profile: NormalizedSocialProfile): Promise<string> {
		for (let attempt = 0; attempt < 10; attempt++) {
			const candidate = buildPrivateSocialMemberPhone(profile, attempt);
			const existingMember = await this.memberModel.exists({ memberPhone: candidate }).exec();
			if (!existingMember) return candidate;
		}

		throw new BadRequestException(Message.CREATE_FAILED);
	}

	private async buildUniqueKakaoMemberNick(profile: NormalizedSocialProfile): Promise<string> {
		if (profile.email) return this.buildUniqueSocialMemberNick(profile);

		for (let attempt = 0; attempt < 10; attempt++) {
			const candidate = buildPrivateSocialMemberNick(profile, attempt);
			const existingMember = await this.memberModel.exists({ memberNick: candidate }).exec();
			if (!existingMember) return candidate;
		}

		throw new BadRequestException(Message.CREATE_FAILED);
	}

	private async buildUniqueKakaoMemberPhone(profile: NormalizedSocialProfile): Promise<string> {
		if (profile.email) return this.buildUniqueSocialMemberPhone(profile);

		for (let attempt = 0; attempt < 10; attempt++) {
			const candidate = buildPrivateSocialMemberPhone(profile, attempt);
			const existingMember = await this.memberModel.exists({ memberPhone: candidate }).exec();
			if (!existingMember) return candidate;
		}

		throw new BadRequestException(Message.CREATE_FAILED);
	}
}
