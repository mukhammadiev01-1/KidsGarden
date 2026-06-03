import { Field, InputType, Int } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, Length, Min } from 'class-validator';
import type { ObjectId } from 'mongoose';
import { GroupStatus } from '../../enums/group.enum';

@InputType()
export class GroupUpdate {
	@IsNotEmpty()
	@Field(() => String)
	_id: ObjectId;

	@IsOptional()
	@Length(2, 100)
	@Field(() => String, { nullable: true })
	groupName?: string;

	@IsOptional()
	@Length(1, 50)
	@Field(() => String, { nullable: true })
	groupAgeRange?: string;

	@IsOptional()
	@Min(1)
	@Field(() => Int, { nullable: true })
	groupCapacity?: number;

	@IsOptional()
	@Field(() => [String], { nullable: true })
	teacherIds?: ObjectId[];

	@IsOptional()
	@Field(() => GroupStatus, { nullable: true })
	groupStatus?: GroupStatus;
}
