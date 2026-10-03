import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AppLoginService } from './app-login.service';
import { AppLoginCodeInput, AppLoginExchangeInput } from '../../libs/dto/app-login/app-login.input';
import { Member } from '../../libs/dto/member/member';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';

@Resolver()
export class AppLoginResolver {
	constructor(private readonly appLoginService: AppLoginService) {}

	/** Called by the website, signed in, right before it returns to the app. */
	@UseGuards(AuthGuard)
	@Mutation(() => String)
	public async createAppLoginCode(
		@Args('input') input: AppLoginCodeInput,
		@AuthMember() authMember: Member,
	): Promise<string> {
		console.log('Mutation: createAppLoginCode');
		return await this.appLoginService.createCode(authMember, input);
	}

	/** Called by the app, signed out, with the code from the return link. */
	@Mutation(() => Member)
	public async exchangeAppLoginCode(@Args('input') input: AppLoginExchangeInput): Promise<Member> {
		console.log('Mutation: exchangeAppLoginCode');
		return await this.appLoginService.exchangeCode(input);
	}
}
