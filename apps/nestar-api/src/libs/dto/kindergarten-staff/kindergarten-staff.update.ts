import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional } from 'class-validator';
import type { ObjectId } from 'mongoose';
import { StaffRole, StaffStatus } from '../../enums/kindergarten-staff.enum';

@InputType()
export class KindergartenStaffUpdate {
	@IsNotEmpty()
	@Field(() => String)
	_id: ObjectId;

	@IsOptional()
	@Field(() => StaffRole, { nullable: true })
	staffRole?: StaffRole;

	@IsOptional()
	@Field(() => StaffStatus, { nullable: true })
	staffStatus?: StaffStatus;
}
