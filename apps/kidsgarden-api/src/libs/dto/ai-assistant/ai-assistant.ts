import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class AiAssistantResponse {
	@Field(() => String)
	answer: string;

	@Field(() => String, { nullable: true })
	model?: string;
}
