import { Field, ObjectType } from '@nestjs/graphql';
import type { ObjectId } from 'mongoose';
import { NotificationAudience, NotificationTargetType, NotificationType } from '../../enums/notification.enum';
import { MemberType } from '../../enums/member.enum';
import { TotalCounter } from '../member/member';

@ObjectType()
export class Notification {
	@Field(() => String)
	_id: ObjectId;

	@Field(() => String)
	recipientId: ObjectId;

	@Field(() => String, { nullable: true })
	senderId?: ObjectId;

	@Field(() => MemberType, { nullable: true })
	recipientRole?: MemberType;

	@Field(() => NotificationType)
	type: NotificationType;

	@Field(() => NotificationAudience)
	audience: NotificationAudience;

	@Field(() => String)
	title: string;

	@Field(() => String)
	message: string;

	@Field(() => NotificationTargetType)
	targetType: NotificationTargetType;

	@Field(() => String)
	targetId: string;

	@Field(() => String, { nullable: true })
	metadata?: string;

	@Field(() => Boolean)
	isRead: boolean;

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;
}

@ObjectType()
export class Notifications {
	@Field(() => [Notification])
	list: Notification[];

	@Field(() => [TotalCounter], { nullable: true })
	metaCounter: TotalCounter[];
}
