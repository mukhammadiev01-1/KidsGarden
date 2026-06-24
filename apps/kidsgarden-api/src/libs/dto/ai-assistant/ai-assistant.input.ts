import { Field, InputType } from '@nestjs/graphql';
import { IsOptional, IsString, Length } from 'class-validator';

@InputType()
export class AiAssistantInput {
	@IsString()
	@Length(1, 2000)
	@Field(() => String)
	message: string;

	@IsOptional()
	@IsString()
	@Length(1, 200)
	@Field(() => String, { nullable: true })
	pageContext?: string;

	@IsOptional()
	@IsString()
	@Length(1, 80)
	@Field(() => String, { nullable: true })
	roleContext?: string;
}
