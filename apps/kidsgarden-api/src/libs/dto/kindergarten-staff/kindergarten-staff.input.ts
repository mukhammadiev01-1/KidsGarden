import { Field, InputType, Int } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, Length, Min } from 'class-validator';
import type { ObjectId } from 'mongoose';
import { Direction } from '../../enums/common.enum';
import { StaffRole, StaffStatus } from '../../enums/kindergarten-staff.enum';

@InputType()
export class KindergartenStaffInput {
	@IsNotEmpty()
	@Field(() => String)
	kindergartenId: ObjectId;

	@IsNotEmpty()
	@Field(() => String)
	memberId: ObjectId;

	@IsNotEmpty()
	@Field(() => StaffRole)
	staffRole: StaffRole;

	@IsOptional()
	@Field(() => StaffStatus, { nullable: true })
	staffStatus?: StaffStatus;
}

@InputType()
class KSSearch {
	@IsOptional()
	@Field(() => String, { nullable: true })
	kindergartenId?: ObjectId;

	@IsOptional()
	@Field(() => String, { nullable: true })
	memberId?: ObjectId;

	@IsOptional()
	@Field(() => StaffRole, { nullable: true })
	staffRole?: StaffRole;

	@IsOptional()
	@Field(() => StaffStatus, { nullable: true })
	staffStatus?: StaffStatus;
}

@InputType()
export class KindergartenStaffsInquiry {
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
	@Field(() => KSSearch)
	search: KSSearch;
}

@InputType()
export class StaffCandidatesInquiry {
	@IsNotEmpty()
	@Field(() => String)
	kindergartenId: ObjectId;

	@IsNotEmpty()
	@Length(2, 50)
	@Field(() => String)
	searchText: string;

	@IsOptional()
	@Field(() => StaffRole, { nullable: true })
	staffRole?: StaffRole;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit: number;
}
