import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, Length } from 'class-validator';
import type { ObjectId } from 'mongoose';
import { AttendanceStatus } from '../../enums/attendance.enum';

@InputType()
export class AttendanceUpdate {
	@IsNotEmpty()
	@Field(() => String)
	_id: ObjectId;

	@IsOptional()
	@Field(() => String, { nullable: true })
	childId?: ObjectId;

	@IsOptional()
	@Field(() => String, { nullable: true })
	kindergartenId?: ObjectId;

	@IsOptional()
	@Field(() => String, { nullable: true })
	groupId?: ObjectId;

	@IsOptional()
	@Field(() => Date, { nullable: true })
	attendanceDate?: Date;

	@IsOptional()
	@Field(() => AttendanceStatus, { nullable: true })
	attendanceStatus?: AttendanceStatus;

	@IsOptional()
	@Length(1, 300)
	@Field(() => String, { nullable: true })
	note?: string;

	markedBy?: ObjectId;
}
