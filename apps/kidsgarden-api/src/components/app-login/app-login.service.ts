import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { createHash, randomBytes, timingSafeEqual } from 'crypto';
import { Model, ObjectId } from 'mongoose';
import { Member } from '../../libs/dto/member/member';
import { AppLoginCodeInput, AppLoginExchangeInput } from '../../libs/dto/app-login/app-login.input';
import { Message } from '../../libs/enums/common.enum';
import { MemberStatus } from '../../libs/enums/member.enum';
import { AuthService } from '../auth/auth.service';

interface AppLoginCode {
	_id: ObjectId;
	codeHash: string;
	memberId: ObjectId;
	challenge: string;
	expiresAt: Date;
}

/**
 * Hands a website session over to the mobile app.
 *
 * The app opens the website's login in the phone's in-app browser with a
 * challenge = SHA-256(verifier). Once the member is signed in there, the
 * website asks for a code bound to that challenge and returns to the app with
 * it. The app trades code + verifier for its own session. A code is single
 * use, lives for a minute, and is useless to anything that intercepts the
 * return link, because only the app that started the login has the verifier.
 */
@Injectable()
export class AppLoginService {
	private readonly codeTtlMs = 60 * 1000;

	constructor(
		@InjectModel('AppLoginCode') private readonly appLoginCodeModel: Model<AppLoginCode>,
		@InjectModel('Member') private readonly memberModel: Model<Member>,
		private readonly authService: AuthService,
	) {}

	public async createCode(authMember: Member, input: AppLoginCodeInput): Promise<string> {
		const code = randomBytes(32).toString('hex');
		await this.appLoginCodeModel.create({
			codeHash: this.sha256Hex(code),
			memberId: authMember._id,
			challenge: input.challenge,
			expiresAt: new Date(Date.now() + this.codeTtlMs),
		});

		return code;
	}

	public async exchangeCode(input: AppLoginExchangeInput): Promise<Member> {
		// Deleted on first read, whether or not the verifier matches: one attempt per code.
		const record = await this.appLoginCodeModel
			.findOneAndDelete({ codeHash: this.sha256Hex(input.code) })
			.lean<AppLoginCode>()
			.exec();
		if (!record || record.expiresAt.getTime() < Date.now()) {
			throw new UnauthorizedException(Message.NOT_AUTHENTICATED);
		}

		const expected = Buffer.from(record.challenge);
		const actual = Buffer.from(createHash('sha256').update(input.verifier).digest('base64url'));
		if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
			throw new UnauthorizedException(Message.NOT_AUTHENTICATED);
		}

		const member = await this.memberModel.findById(record.memberId).lean<Member>().exec();
		if (!member || member.memberStatus !== MemberStatus.ACTIVE) {
			throw new UnauthorizedException(Message.NOT_AUTHENTICATED);
		}

		member.accessToken = await this.authService.createToken(member);
		return member;
	}

	private sha256Hex(value: string): string {
		return createHash('sha256').update(value).digest('hex');
	}
}
