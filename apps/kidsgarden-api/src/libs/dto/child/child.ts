import { Field, ObjectType } from '@nestjs/graphql';
import type { ObjectId } from 'mongoose';
import { TotalCounter } from '../member/member';
import { ChildGender, ChildStatus } from '../../enums/child.enum';

@ObjectType()
export class Child {
	@Field(() => String)
	_id: ObjectId;

	@Field(() => String)
	childFullName: string;

	@Field(() => Date)
	childBirthDate: Date;

	@Field(() => ChildGender)
	childGender: ChildGender;

	@Field(() => String)
	childImage: string;

	@Field(() => ChildStatus)
	childStatus: ChildStatus;

	@Field(() => String)
	parentId: ObjectId;

	@Field(() => String)
	kindergartenId: ObjectId;

	@Field(() => String)
	groupId: ObjectId;

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;
}

@ObjectType()
export class Children {
	@Field(() => [Child])
	list: Child[];

	@Field(() => [TotalCounter], { nullable: true })
	metaCounter: TotalCounter[];
}
