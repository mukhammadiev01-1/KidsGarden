import { Field, InputType, Int } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, Length, Min } from 'class-validator';
import type { ObjectId } from 'mongoose';
import { Direction } from '../../enums/common.enum';
import { StaffRole } from '../../enums/kindergarten-staff.enum';
import { StaffApplicationStatus } from '../../enums/staff-application.enum';

@InputType()
export class StaffApplicationInput {
	@IsNotEmpty()
	@Field(() => String)
	kindergartenId: ObjectId;

	@IsNotEmpty()
	@Field(() => StaffRole)
	requestedRole: StaffRole;

	@IsOptional()
	@Length(1, 500)
	@Field(() => String, { nullable: true })
	message?: string;
}

@InputType()
class StaffApplicationSearch {
	@IsOptional()
	@Field(() => String, { nullable: true })
	kindergartenId?: ObjectId;

	@IsOptional()
	@Field(() => String, { nullable: true })
	applicantId?: ObjectId;

	@IsOptional()
	@Field(() => StaffRole, { nullable: true })
	requestedRole?: StaffRole;

	@IsOptional()
	@Field(() => StaffApplicationStatus, { nullable: true })
	applicationStatus?: StaffApplicationStatus;
}

@InputType()
export class StaffApplicationsInquiry {
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
	@Field(() => StaffApplicationSearch)
	search: StaffApplicationSearch;
}

@InputType()
export class StaffApplicationReviewInput {
	@IsNotEmpty()
	@Field(() => String)
	_id: ObjectId;

	@IsOptional()
	@Length(1, 500)
	@Field(() => String, { nullable: true })
	rejectReason?: string;
}
