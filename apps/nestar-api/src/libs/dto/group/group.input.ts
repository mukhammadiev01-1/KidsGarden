import { Field, InputType, Int } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, Length, Min } from 'class-validator';
import type { ObjectId } from 'mongoose';
import { Direction } from '../../enums/common.enum';
import { GroupStatus } from '../../enums/group.enum';

@InputType()
export class GroupInput {
	@IsNotEmpty()
	@Field(() => String)
	kindergartenId: ObjectId;

	@IsNotEmpty()
	@Length(2, 100)
	@Field(() => String)
	groupName: string;

	@IsNotEmpty()
	@Length(1, 50)
	@Field(() => String)
	groupAgeRange: string;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	groupCapacity: number;

	@IsOptional()
	@Field(() => [String], { nullable: true })
	teacherIds?: ObjectId[];

	@IsOptional()
	@Field(() => GroupStatus, { nullable: true })
	groupStatus?: GroupStatus;
}

@InputType()
class GSearch {
	@IsOptional()
	@Field(() => String, { nullable: true })
	kindergartenId?: ObjectId;

	@IsOptional()
	@Field(() => String, { nullable: true })
	teacherId?: ObjectId;

	@IsOptional()
	@Field(() => GroupStatus, { nullable: true })
	groupStatus?: GroupStatus;

	@IsOptional()
	@Field(() => String, { nullable: true })
	text?: string;
}

@InputType()
export class GroupsInquiry {
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
	@Field(() => GSearch)
	search: GSearch;
}
