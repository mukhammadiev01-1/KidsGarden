import { Field, InputType, Int } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, Min } from 'class-validator';
import type { ObjectId } from 'mongoose';
import { Direction } from '../../enums/common.enum';

@InputType()
export class ChatAttachmentInput {
	@IsNotEmpty()
	@Field(() => String)
	url: string;

	@IsNotEmpty()
	@Field(() => String)
	name: string;

	@IsNotEmpty()
	@Field(() => String)
	mimeType: string;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	size: number;
}

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

	@IsOptional()
	@Field(() => String, { nullable: true })
	text?: string;

	@IsOptional()
	@Field(() => [ChatAttachmentInput], { nullable: true })
	attachments?: ChatAttachmentInput[];
}
