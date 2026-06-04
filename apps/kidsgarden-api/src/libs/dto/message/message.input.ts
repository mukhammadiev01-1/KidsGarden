import { Field, InputType, Int } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, Length, Min } from 'class-validator';
import type { ObjectId } from 'mongoose';
import { Direction } from '../../enums/common.enum';

@InputType()
class MessageSearch {
	@IsNotEmpty()
	@Field(() => String)
	conversationId: ObjectId;
}

@InputType()
export class MessagesInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@Field(() => MessageSearch)
	search: MessageSearch;
}

@InputType()
export class SendMessageInput {
	@IsNotEmpty()
	@Field(() => String)
	conversationId: ObjectId;

	@IsNotEmpty()
	@Length(1, 2000)
	@Field(() => String)
	text: string;
}
