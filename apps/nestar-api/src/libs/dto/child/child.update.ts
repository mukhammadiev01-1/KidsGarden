import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, Length } from 'class-validator';
import type { ObjectId } from 'mongoose';
import { ChildGender, ChildStatus } from '../../enums/child.enum';

@InputType()
export class ChildUpdate {
	@IsNotEmpty()
	@Field(() => String)
	_id: ObjectId;

	@IsOptional()
	@Length(2, 100)
	@Field(() => String, { nullable: true })
	childFullName?: string;

	@IsOptional()
	@Field(() => Date, { nullable: true })
	childBirthDate?: Date;

	@IsOptional()
	@Field(() => ChildGender, { nullable: true })
	childGender?: ChildGender;

	@IsOptional()
	@Field(() => String, { nullable: true })
	childImage?: string;

	@IsOptional()
	@Field(() => ChildStatus, { nullable: true })
	childStatus?: ChildStatus;

	@IsOptional()
	@Field(() => String, { nullable: true })
	parentId?: ObjectId;

	@IsOptional()
	@Field(() => String, { nullable: true })
	kindergartenId?: ObjectId;

	@IsOptional()
	@Field(() => String, { nullable: true })
	groupId?: ObjectId;
}
