import { Field, ObjectType } from '@nestjs/graphql';
import type { ObjectId } from 'mongoose';
import { TotalCounter } from '../member/member';
import { StaffRole, StaffStatus } from '../../enums/kindergarten-staff.enum';
import { MemberStatus, MemberType } from '../../enums/member.enum';

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

@ObjectType()
export class StaffCandidate {
	@Field(() => String)
	_id: ObjectId;

	@Field(() => String)
	memberNick: string;

	@Field(() => String)
	memberPhone: string;

	@Field(() => MemberType)
	memberType: MemberType;

	@Field(() => MemberStatus)
	memberStatus: MemberStatus;

	@Field(() => String)
	memberImage: string;
}

@ObjectType()
export class StaffCandidates {
	@Field(() => [StaffCandidate])
	list: StaffCandidate[];

	@Field(() => [TotalCounter], { nullable: true })
	metaCounter: TotalCounter[];
}
