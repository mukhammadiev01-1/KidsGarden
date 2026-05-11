import { Field, InputType, Int } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, Length, Min } from 'class-validator';
import type { ObjectId } from 'mongoose';
import { AttendanceStatus } from '../../enums/attendance.enum';
import { Direction } from '../../enums/common.enum';

@InputType()
export class AttendanceInput {
	@IsNotEmpty()
	@Field(() => String)
	childId: ObjectId;

	@IsNotEmpty()
	@Field(() => String)
	kindergartenId: ObjectId;

	@IsNotEmpty()
	@Field(() => String)
	groupId: ObjectId;

	@IsNotEmpty()
	@Field(() => Date)
	attendanceDate: Date;

	@IsNotEmpty()
	@Field(() => AttendanceStatus)
	attendanceStatus: AttendanceStatus;

	@IsOptional()
	@Length(1, 300)
	@Field(() => String, { nullable: true })
	note?: string;

	markedBy?: ObjectId;
}

@InputType()
class AISearch {
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
}

@InputType()
export class AttendancesInquiry {
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
	@Field(() => AISearch)
	search: AISearch;
}

@InputType()
export class AttendancePaginationInput {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@Field(() => Date, { nullable: true })
	attendanceDate?: Date;

	@IsOptional()
	@Field(() => AttendanceStatus, { nullable: true })
	attendanceStatus?: AttendanceStatus;
}
