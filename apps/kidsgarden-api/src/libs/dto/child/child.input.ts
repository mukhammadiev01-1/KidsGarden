import { Field, InputType, Int } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, Length, Min } from 'class-validator';
import type { ObjectId } from 'mongoose';
import { ChildGender, ChildStatus } from '../../enums/child.enum';
import { Direction } from '../../enums/common.enum';

@InputType()
export class ChildInput {
	@IsNotEmpty()
	@Length(2, 100)
	@Field(() => String)
	childFullName: string;

	@IsNotEmpty()
	@Field(() => Date)
	childBirthDate: Date;

	@IsNotEmpty()
	@Field(() => ChildGender)
	childGender: ChildGender;

	@IsOptional()
	@Field(() => String, { nullable: true })
	childImage?: string;

	@IsOptional()
	@Field(() => ChildStatus, { nullable: true })
	childStatus?: ChildStatus;

	@IsNotEmpty()
	@Field(() => String)
	parentId: ObjectId;

	@IsNotEmpty()
	@Field(() => String)
	kindergartenId: ObjectId;

	@IsNotEmpty()
	@Field(() => String)
	groupId: ObjectId;
}

@InputType()
class CSearch {
	@IsOptional()
	@Field(() => String, { nullable: true })
	parentId?: ObjectId;

	@IsOptional()
	@Field(() => String, { nullable: true })
	kindergartenId?: ObjectId;

	@IsOptional()
	@Field(() => String, { nullable: true })
	groupId?: ObjectId;

	@IsOptional()
	@Field(() => ChildStatus, { nullable: true })
	childStatus?: ChildStatus;

	@IsOptional()
	@Field(() => String, { nullable: true })
	text?: string;
}

@InputType()
export class ChildrenInquiry {
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
	@Field(() => CSearch)
	search: CSearch;
}
