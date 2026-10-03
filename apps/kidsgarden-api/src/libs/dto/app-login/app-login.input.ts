import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, Matches } from 'class-validator';

// base64url without padding: 43 chars for a SHA-256 digest, 43-128 for a verifier (RFC 7636).
const CHALLENGE_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const VERIFIER_PATTERN = /^[A-Za-z0-9_-]{43,128}$/;
const CODE_PATTERN = /^[a-f0-9]{64}$/;

@InputType()
export class AppLoginCodeInput {
	@IsNotEmpty()
	@Matches(CHALLENGE_PATTERN)
	@Field(() => String)
	challenge: string;
}

@InputType()
export class AppLoginExchangeInput {
	@IsNotEmpty()
	@Matches(CODE_PATTERN)
	@Field(() => String)
	code: string;

	@IsNotEmpty()
	@Matches(VERIFIER_PATTERN)
	@Field(() => String)
	verifier: string;
}
