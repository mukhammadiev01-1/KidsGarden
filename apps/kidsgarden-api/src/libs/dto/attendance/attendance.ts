import { Field, ObjectType } from '@nestjs/graphql';
import type { ObjectId } from 'mongoose';
import { TotalCounter } from '../member/member';
import { AttendanceStatus } from '../../enums/attendance.enum';

@ObjectType()
export class Attendance {
	@Field(() => String)
	_id: ObjectId;

	@Field(() => String)
	childId: ObjectId;

	@Field(() => String)
	kindergartenId: ObjectId;

	@Field(() => String)
	groupId: ObjectId;

	@Field(() => Date)
	attendanceDate: Date;

	@Field(() => AttendanceStatus)
	attendanceStatus: AttendanceStatus;

	@Field(() => String)
	markedBy: ObjectId;

	@Field(() => String, { nullable: true })
	note?: string;

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;
}

@ObjectType()
export class Attendances {
	@Field(() => [Attendance])
	list: Attendance[];

	@Field(() => [TotalCounter], { nullable: true })
	metaCounter: TotalCounter[];
}
