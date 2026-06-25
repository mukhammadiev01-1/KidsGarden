import { Field, InputType, Int } from '@nestjs/graphql';
import { IsEnum, IsNotEmpty, IsOptional, Min } from 'class-validator';
import type { ObjectId } from 'mongoose';
import { ConversationType } from '../../enums/chat.enum';

@InputType()
export class ParentTeacherConversationInput {
	@IsNotEmpty()
	@Field(() => String)
	childId: ObjectId;

	@IsOptional()
	@Field(() => String, { nullable: true })
	teacherId?: ObjectId;
}

@InputType()
export class MyConversationsInput {
	@IsOptional()
	@Min(1)
	@Field(() => Int, { nullable: true })
	page?: number;

	@IsOptional()
	@Min(1)
	@Field(() => Int, { nullable: true })
	limit?: number;

	@IsOptional()
	@IsEnum(ConversationType)
	@Field(() => ConversationType, { nullable: true })
	conversationType?: ConversationType;

	@IsOptional()
	@Field(() => String, { nullable: true })
	search?: string;
}
