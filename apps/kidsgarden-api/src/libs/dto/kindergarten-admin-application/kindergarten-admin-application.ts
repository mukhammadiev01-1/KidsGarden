import { Field, ObjectType } from '@nestjs/graphql';
import type { ObjectId } from 'mongoose';
import { MemberPreview, TotalCounter } from '../member/member';
import { KindergartenAdminApplicationStatus } from '../../enums/kindergarten-admin-application.enum';

@ObjectType()
export class KindergartenAdminApplication {
	@Field(() => String)
	_id: ObjectId;

	@Field(() => String)
	applicantId: ObjectId;

	@Field(() => KindergartenAdminApplicationStatus)
	applicationStatus: KindergartenAdminApplicationStatus;

	@Field(() => String, { nullable: true })
	message?: string;

	@Field(() => String, { nullable: true })
	kindergartenTitle?: string;

	@Field(() => String, { nullable: true })
	kindergartenAddress?: string;

	@Field(() => String, { nullable: true })
	kindergartenPhone?: string;

	@Field(() => String, { nullable: true })
	businessInfo?: string;

	@Field(() => String, { nullable: true })
	reviewedBy?: ObjectId;

	@Field(() => Date, { nullable: true })
	reviewedAt?: Date;

	@Field(() => String, { nullable: true })
	rejectReason?: string;

	@Field(() => MemberPreview, { nullable: true })
	applicantData?: MemberPreview;

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;
}

@ObjectType()
export class KindergartenAdminApplications {
	@Field(() => [KindergartenAdminApplication])
	list: KindergartenAdminApplication[];

	@Field(() => [TotalCounter], { nullable: true })
	metaCounter: TotalCounter[];
}
