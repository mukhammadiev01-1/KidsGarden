import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, Length } from 'class-validator';
import type { ObjectId } from 'mongoose';
import { ApplicationStatus } from '../../enums/application.enum';

@InputType()
export class ApplicationStatusUpdateInput {
	@IsNotEmpty()
	@Field(() => String)
	_id: ObjectId;

	@IsNotEmpty()
	@Field(() => ApplicationStatus)
	status: ApplicationStatus;

	@IsOptional()
	@Length(1, 500)
	@Field(() => String, { nullable: true })
	adminNote?: string;
}
