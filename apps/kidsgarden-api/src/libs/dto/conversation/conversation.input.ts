import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional } from 'class-validator';
import type { ObjectId } from 'mongoose';

@InputType()
export class ParentTeacherConversationInput {
	@IsNotEmpty()
	@Field(() => String)
	childId: ObjectId;

	@IsOptional()
	@Field(() => String, { nullable: true })
	teacherId?: ObjectId;
}
