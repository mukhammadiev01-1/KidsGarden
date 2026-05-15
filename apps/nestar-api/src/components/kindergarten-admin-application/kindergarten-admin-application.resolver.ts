import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { KindergartenAdminApplicationService } from './kindergarten-admin-application.service';
import {
	KindergartenAdminApplication,
	KindergartenAdminApplications,
} from '../../libs/dto/kindergarten-admin-application/kindergarten-admin-application';
import {
	KindergartenAdminApplicationInput,
	KindergartenAdminApplicationReviewInput,
	KindergartenAdminApplicationsInquiry,
} from '../../libs/dto/kindergarten-admin-application/kindergarten-admin-application.input';
import { Member } from '../../libs/dto/member/member';
import { MemberType } from '../../libs/enums/member.enum';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@Resolver()
export class KindergartenAdminApplicationResolver {
	constructor(private readonly kindergartenAdminApplicationService: KindergartenAdminApplicationService) {}

	@Roles(MemberType.PARENT)
	@UseGuards(RolesGuard)
	@Mutation(() => KindergartenAdminApplication)
	public async createKindergartenAdminApplication(
		@Args('input') input: KindergartenAdminApplicationInput,
		@AuthMember() authMember: Member,
	): Promise<KindergartenAdminApplication> {
		console.log('Mutation: createKindergartenAdminApplication');
		return await this.kindergartenAdminApplicationService.createKindergartenAdminApplication(authMember, input);
	}

	@Roles(MemberType.PARENT)
	@UseGuards(RolesGuard)
	@Mutation(() => KindergartenAdminApplication)
	public async cancelKindergartenAdminApplication(
		@Args('applicationId') input: string,
		@AuthMember() authMember: Member,
	): Promise<KindergartenAdminApplication> {
		console.log('Mutation: cancelKindergartenAdminApplication');
		const applicationId = shapeIntoMongoObjectId(input);
		return await this.kindergartenAdminApplicationService.cancelKindergartenAdminApplication(
			authMember,
			applicationId,
		);
	}

	@Roles(MemberType.SUPER_ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => KindergartenAdminApplication)
	public async approveKindergartenAdminApplication(
		@Args('input') input: KindergartenAdminApplicationReviewInput,
		@AuthMember() authMember: Member,
	): Promise<KindergartenAdminApplication> {
		console.log('Mutation: approveKindergartenAdminApplication');
		input._id = shapeIntoMongoObjectId(input._id);
		return await this.kindergartenAdminApplicationService.approveKindergartenAdminApplication(authMember, input);
	}

	@Roles(MemberType.SUPER_ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => KindergartenAdminApplication)
	public async rejectKindergartenAdminApplication(
		@Args('input') input: KindergartenAdminApplicationReviewInput,
		@AuthMember() authMember: Member,
	): Promise<KindergartenAdminApplication> {
		console.log('Mutation: rejectKindergartenAdminApplication');
		input._id = shapeIntoMongoObjectId(input._id);
		return await this.kindergartenAdminApplicationService.rejectKindergartenAdminApplication(authMember, input);
	}

	@Roles(MemberType.PARENT)
	@UseGuards(RolesGuard)
	@Query(() => KindergartenAdminApplications)
	public async getMyKindergartenAdminApplications(
		@Args('input') input: KindergartenAdminApplicationsInquiry,
		@AuthMember() authMember: Member,
	): Promise<KindergartenAdminApplications> {
		console.log('Query: getMyKindergartenAdminApplications');
		if (input.search?.applicantId) input.search.applicantId = shapeIntoMongoObjectId(input.search.applicantId);
		return await this.kindergartenAdminApplicationService.getMyKindergartenAdminApplications(authMember, input);
	}

	@Roles(MemberType.SUPER_ADMIN)
	@UseGuards(RolesGuard)
	@Query(() => KindergartenAdminApplications)
	public async getKindergartenAdminApplications(
		@Args('input') input: KindergartenAdminApplicationsInquiry,
	): Promise<KindergartenAdminApplications> {
		console.log('Query: getKindergartenAdminApplications');
		if (input.search?.applicantId) input.search.applicantId = shapeIntoMongoObjectId(input.search.applicantId);
		return await this.kindergartenAdminApplicationService.getKindergartenAdminApplications(input);
	}
}
