import { Field, Int, ObjectType } from '@nestjs/graphql';
import type { ObjectId } from 'mongoose';
import { ConversationType } from '../../enums/chat.enum';

@ObjectType()
export class Conversation {
	@Field(() => String)
	_id: ObjectId;

	@Field(() => ConversationType)
	type: ConversationType;

	@Field(() => String, { nullable: true })
	applicationId?: ObjectId;

	@Field(() => String)
	kindergartenId: ObjectId;

	@Field(() => String)
	parentId: ObjectId;

	@Field(() => String, { nullable: true })
	childId?: ObjectId;

	@Field(() => String, { nullable: true })
	groupId?: ObjectId;

	@Field(() => String, { nullable: true })
	teacherId?: ObjectId;

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

@ObjectType()
export class MyConversationSummary {
	@Field(() => String)
	conversationId: string;

	@Field(() => ConversationType)
	conversationType: ConversationType;

	@Field(() => String)
	title: string;

	@Field(() => String, { nullable: true })
	subtitle?: string;

	@Field(() => String, { nullable: true })
	avatar?: string;

	@Field(() => String, { nullable: true })
	kindergartenId?: string;

	@Field(() => String, { nullable: true })
	childId?: string;

	@Field(() => String, { nullable: true })
	teacherId?: string;

	@Field(() => String, { nullable: true })
	parentId?: string;

	@Field(() => String, { nullable: true })
	applicationId?: string;

	@Field(() => String, { nullable: true })
	lastMessage?: string;

	@Field(() => Date, { nullable: true })
	lastMessageAt?: Date;

	@Field(() => Int)
	unreadCount: number;

	@Field(() => String, { nullable: true })
	targetRoute?: string;

	@Field(() => String, { nullable: true })
	participantLabel?: string;
}

@ObjectType()
export class MyConversations {
	@Field(() => [MyConversationSummary])
	list: MyConversationSummary[];

	@Field(() => Int)
	total: number;
}
