import { Field, Int, ObjectType } from '@nestjs/graphql';
import type { ObjectId } from 'mongoose';
import { TotalCounter } from '../member/member';

@ObjectType()
export class ChatAttachment {
	@Field(() => String)
	url: string;

	@Field(() => String)
	name: string;

	@Field(() => String)
	mimeType: string;

	@Field(() => Int)
	size: number;
}

@ObjectType()
export class Message {
	@Field(() => String)
	_id: ObjectId;

	@Field(() => String)
	conversationId: ObjectId;

	@Field(() => String)
	senderId: ObjectId;

	@Field(() => String, { nullable: true })
	text?: string;

	@Field(() => [ChatAttachment], { nullable: true })
	attachments?: ChatAttachment[];

	@Field(() => [String])
	readBy: ObjectId[];

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;
}

@ObjectType()
export class Messages {
	@Field(() => [Message])
	list: Message[];

	@Field(() => [TotalCounter], { nullable: true })
	metaCounter: TotalCounter[];
}
