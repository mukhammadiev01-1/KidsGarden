import { Field, InputType, Int } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, Length, Min } from 'class-validator';
import type { ObjectId } from 'mongoose';
import { Direction } from '../../enums/common.enum';
import { KindergartenAdminApplicationStatus } from '../../enums/kindergarten-admin-application.enum';

@InputType()
export class KindergartenAdminApplicationInput {
	@IsOptional()
	@Length(1, 500)
	@Field(() => String, { nullable: true })
	message?: string;

	@IsOptional()
	@Length(1, 100)
	@Field(() => String, { nullable: true })
	kindergartenTitle?: string;

	@IsOptional()
	@Length(1, 200)
	@Field(() => String, { nullable: true })
	kindergartenAddress?: string;

	@IsOptional()
	@Length(1, 30)
	@Field(() => String, { nullable: true })
	kindergartenPhone?: string;

	@IsOptional()
	@Length(1, 500)
	@Field(() => String, { nullable: true })
	businessInfo?: string;
}

@InputType()
class KindergartenAdminApplicationSearch {
	@IsOptional()
	@Field(() => String, { nullable: true })
	applicantId?: ObjectId;

	@IsOptional()
	@Field(() => KindergartenAdminApplicationStatus, { nullable: true })
	applicationStatus?: KindergartenAdminApplicationStatus;
}

@InputType()
export class KindergartenAdminApplicationsInquiry {
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

	@IsOptional()
	@Field(() => KindergartenAdminApplicationSearch, { nullable: true })
	search?: KindergartenAdminApplicationSearch;
}

@InputType()
export class KindergartenAdminApplicationReviewInput {
	@IsNotEmpty()
	@Field(() => String)
	_id: ObjectId;

	@IsOptional()
	@Length(1, 500)
	@Field(() => String, { nullable: true })
	rejectReason?: string;
}
