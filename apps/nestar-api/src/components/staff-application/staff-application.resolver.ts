import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { StaffApplicationService } from './staff-application.service';
import { StaffApplication, StaffApplications } from '../../libs/dto/staff-application/staff-application';
import {
	StaffApplicationInput,
	StaffApplicationReviewInput,
	StaffApplicationsInquiry,
} from '../../libs/dto/staff-application/staff-application.input';
import { Member } from '../../libs/dto/member/member';
import { MemberType } from '../../libs/enums/member.enum';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@Resolver()
export class StaffApplicationResolver {
	constructor(private readonly staffApplicationService: StaffApplicationService) {}

	@Roles(MemberType.PARENT)
	@UseGuards(RolesGuard)
	@Mutation(() => StaffApplication)
	public async createStaffApplication(
		@Args('input') input: StaffApplicationInput,
		@AuthMember() authMember: Member,
	): Promise<StaffApplication> {
		console.log('Mutation: createStaffApplication');
		input.kindergartenId = shapeIntoMongoObjectId(input.kindergartenId);
		return await this.staffApplicationService.createStaffApplication(authMember, input);
	}

	@Roles(MemberType.PARENT)
	@UseGuards(RolesGuard)
	@Mutation(() => StaffApplication)
	public async cancelStaffApplication(
		@Args('applicationId') input: string,
		@AuthMember() authMember: Member,
	): Promise<StaffApplication> {
		console.log('Mutation: cancelStaffApplication');
		const applicationId = shapeIntoMongoObjectId(input);
		return await this.staffApplicationService.cancelStaffApplication(authMember, applicationId);
	}

	@Roles(MemberType.KINDERGARTEN_ADMIN, MemberType.SUPER_ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => StaffApplication)
	public async approveStaffApplication(
		@Args('input') input: StaffApplicationReviewInput,
		@AuthMember() authMember: Member,
	): Promise<StaffApplication> {
		console.log('Mutation: approveStaffApplication');
		input._id = shapeIntoMongoObjectId(input._id);
		return await this.staffApplicationService.approveStaffApplication(authMember, input);
	}

	@Roles(MemberType.KINDERGARTEN_ADMIN, MemberType.SUPER_ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => StaffApplication)
	public async rejectStaffApplication(
		@Args('input') input: StaffApplicationReviewInput,
		@AuthMember() authMember: Member,
	): Promise<StaffApplication> {
		console.log('Mutation: rejectStaffApplication');
		input._id = shapeIntoMongoObjectId(input._id);
		return await this.staffApplicationService.rejectStaffApplication(authMember, input);
	}

	@Roles(MemberType.PARENT)
	@UseGuards(RolesGuard)
	@Query(() => StaffApplications)
	public async getMyStaffApplications(
		@Args('input') input: StaffApplicationsInquiry,
		@AuthMember() authMember: Member,
	): Promise<StaffApplications> {
		console.log('Query: getMyStaffApplications');
		if (input.search.kindergartenId) input.search.kindergartenId = shapeIntoMongoObjectId(input.search.kindergartenId);
		return await this.staffApplicationService.getMyStaffApplications(authMember, input);
	}

	@Roles(MemberType.KINDERGARTEN_ADMIN, MemberType.SUPER_ADMIN)
	@UseGuards(RolesGuard)
	@Query(() => StaffApplications)
	public async getStaffApplications(
		@Args('input') input: StaffApplicationsInquiry,
		@AuthMember() authMember: Member,
	): Promise<StaffApplications> {
		console.log('Query: getStaffApplications');
		if (input.search.kindergartenId) input.search.kindergartenId = shapeIntoMongoObjectId(input.search.kindergartenId);
		if (input.search.applicantId) input.search.applicantId = shapeIntoMongoObjectId(input.search.applicantId);
		return await this.staffApplicationService.getStaffApplications(authMember, input);
	}
}
