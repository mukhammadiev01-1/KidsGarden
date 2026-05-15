import { Field, ObjectType } from '@nestjs/graphql';
import type { ObjectId } from 'mongoose';
import { TotalCounter } from '../member/member';
import { StaffRole } from '../../enums/kindergarten-staff.enum';
import { StaffApplicationStatus } from '../../enums/staff-application.enum';

@ObjectType()
export class StaffApplication {
	@Field(() => String)
	_id: ObjectId;

	@Field(() => String)
	kindergartenId: ObjectId;

	@Field(() => String)
	applicantId: ObjectId;

	@Field(() => StaffRole)
	requestedRole: StaffRole;

	@Field(() => StaffApplicationStatus)
	applicationStatus: StaffApplicationStatus;

	@Field(() => String, { nullable: true })
	message?: string;

	@Field(() => String, { nullable: true })
	reviewedBy?: ObjectId;

	@Field(() => Date, { nullable: true })
	reviewedAt?: Date;

	@Field(() => String, { nullable: true })
	rejectReason?: string;

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;
}

@ObjectType()
export class StaffApplications {
	@Field(() => [StaffApplication])
	list: StaffApplication[];

	@Field(() => [TotalCounter], { nullable: true })
	metaCounter: TotalCounter[];
}
