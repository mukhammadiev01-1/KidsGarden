import { Field, Int, ObjectType } from '@nestjs/graphql';
import type { ObjectId } from 'mongoose';
import { TotalCounter } from '../member/member';
import { GroupStatus } from '../../enums/group.enum';

@ObjectType()
export class Group {
	@Field(() => String)
	_id: ObjectId;

	@Field(() => String)
	kindergartenId: ObjectId;

	@Field(() => String)
	groupName: string;

	@Field(() => String)
	groupAgeRange: string;

	@Field(() => Int)
	groupCapacity: number;

	@Field(() => [String])
	teacherIds: ObjectId[];

	@Field(() => GroupStatus)
	groupStatus: GroupStatus;

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;
}

@ObjectType()
export class Groups {
	@Field(() => [Group])
	list: Group[];

	@Field(() => [TotalCounter], { nullable: true })
	metaCounter: TotalCounter[];
}
