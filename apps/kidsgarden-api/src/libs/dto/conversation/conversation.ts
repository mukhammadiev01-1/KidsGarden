import { Field, ObjectType } from '@nestjs/graphql';
import type { ObjectId } from 'mongoose';
import { ConversationType } from '../../enums/chat.enum';

@ObjectType()
export class Conversation {
	@Field(() => String)
	_id: ObjectId;

	@Field(() => ConversationType)
	type: ConversationType;

	@Field(() => String)
	applicationId: ObjectId;

	@Field(() => String)
	kindergartenId: ObjectId;

	@Field(() => String)
	parentId: ObjectId;

	@Field(() => [String])
	participantIds: ObjectId[];

	@Field(() => String, { nullable: true })
	lastMessage?: string;

	@Field(() => Date, { nullable: true })
	lastMessageAt?: Date;

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;
}
