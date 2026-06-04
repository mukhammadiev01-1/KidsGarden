import { Field, InputType, Int } from '@nestjs/graphql';
import { IsIn, IsNotEmpty, IsOptional, Min } from 'class-validator';
import type { ObjectId } from 'mongoose';
import { Direction } from '../../enums/common.enum';
import { NotificationTargetType, NotificationType } from '../../enums/notification.enum';

@InputType()
class NotificationSearch {
	@IsOptional()
	@Field(() => Boolean, { nullable: true })
	isRead?: boolean;

	@IsOptional()
	@Field(() => NotificationType, { nullable: true })
	type?: NotificationType;

	@IsOptional()
	@Field(() => NotificationTargetType, { nullable: true })
	targetType?: NotificationTargetType;

	@IsOptional()
	@Field(() => String, { nullable: true })
	targetId?: string;
}

@InputType()
export class NotificationsInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@IsIn(['createdAt', 'updatedAt', 'isRead'])
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsOptional()
	@Field(() => NotificationSearch, { nullable: true })
	search?: NotificationSearch;
}

export interface NotificationInput {
	recipientId: ObjectId;
	senderId?: ObjectId;
	type: NotificationType;
	title: string;
	message: string;
	targetType: NotificationTargetType;
	targetId: ObjectId | string;
	metadata?: Record<string, unknown> | string;
}
