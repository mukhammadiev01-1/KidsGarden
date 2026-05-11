import { Field, ObjectType } from '@nestjs/graphql';
import type { ObjectId } from 'mongoose';
import { TotalCounter } from '../member/member';
import { StaffRole, StaffStatus } from '../../enums/kindergarten-staff.enum';

@ObjectType()
export class KindergartenStaff {
	@Field(() => String)
	_id: ObjectId;

	@Field(() => String)
	kindergartenId: ObjectId;

	@Field(() => String)
	memberId: ObjectId;

	@Field(() => StaffRole)
	staffRole: StaffRole;

	@Field(() => StaffStatus)
	staffStatus: StaffStatus;

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;
}

@ObjectType()
export class KindergartenStaffs {
	@Field(() => [KindergartenStaff])
	list: KindergartenStaff[];

	@Field(() => [TotalCounter], { nullable: true })
	metaCounter: TotalCounter[];
}
