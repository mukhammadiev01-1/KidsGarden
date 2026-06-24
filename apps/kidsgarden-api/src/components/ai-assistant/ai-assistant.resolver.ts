import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AiAssistantInput } from '../../libs/dto/ai-assistant/ai-assistant.input';
import { AiAssistantResponse } from '../../libs/dto/ai-assistant/ai-assistant';
import { AiAssistantService } from './ai-assistant.service';
import { WithoutGuard } from '../auth/guards/without.guard';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { Member } from '../../libs/dto/member/member';

@Resolver()
export class AiAssistantResolver {
	constructor(private readonly aiAssistantService: AiAssistantService) {}

	@UseGuards(WithoutGuard)
	@Mutation(() => AiAssistantResponse)
	public async askAiAssistant(
		@Args('input') input: AiAssistantInput,
		@AuthMember() authMember: Member | null,
		@Context('req') req: any,
	): Promise<AiAssistantResponse> {
		return await this.aiAssistantService.askAiAssistant(input, authMember, req);
	}
}
