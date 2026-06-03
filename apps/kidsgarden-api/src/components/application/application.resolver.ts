import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ApplicationService } from './application.service';
import { Application, Applications } from '../../libs/dto/application/application';
import { ApplicationInput, ApplicationsInquiry } from '../../libs/dto/application/application.input';
import { ApplicationStatusUpdateInput } from '../../libs/dto/application/application.update';
import { Member } from '../../libs/dto/member/member';
import { MemberType } from '../../libs/enums/member.enum';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@Resolver()
export class ApplicationResolver {
	constructor(private readonly applicationService: ApplicationService) {}

	@Roles(MemberType.PARENT)
	@UseGuards(RolesGuard)
	@Mutation(() => Application)
	public async createApplication(
		@Args('input') input: ApplicationInput,
		@AuthMember() authMember: Member,
	): Promise<Application> {
		console.log('Mutation: createApplication');
		input.kindergartenId = shapeIntoMongoObjectId(input.kindergartenId);
		return await this.applicationService.createApplication(authMember, input);
	}

	@Roles(MemberType.PARENT)
	@UseGuards(RolesGuard)
	@Mutation(() => Application)
	public async cancelApplication(
		@Args('applicationId') input: string,
		@AuthMember() authMember: Member,
	): Promise<Application> {
		console.log('Mutation: cancelApplication');
		const applicationId = shapeIntoMongoObjectId(input);
		return await this.applicationService.cancelApplication(authMember, applicationId);
	}

	@Roles(MemberType.KINDERGARTEN_ADMIN, MemberType.SUPER_ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => Application)
	public async updateApplicationStatus(
		@Args('input') input: ApplicationStatusUpdateInput,
		@AuthMember() authMember: Member,
	): Promise<Application> {
		console.log('Mutation: updateApplicationStatus');
		input._id = shapeIntoMongoObjectId(input._id);
		return await this.applicationService.updateApplicationStatus(authMember, input);
	}

	@Roles(MemberType.PARENT)
	@UseGuards(RolesGuard)
	@Query(() => Applications)
	public async getMyApplications(
		@Args('input') input: ApplicationsInquiry,
		@AuthMember() authMember: Member,
	): Promise<Applications> {
		console.log('Query: getMyApplications');
		this.shapeInquiryObjectIds(input);
		return await this.applicationService.getMyApplications(authMember, input);
	}

	@Roles(MemberType.KINDERGARTEN_ADMIN)
	@UseGuards(RolesGuard)
	@Query(() => Applications)
	public async getKindergartenApplications(
		@Args('input') input: ApplicationsInquiry,
		@AuthMember() authMember: Member,
	): Promise<Applications> {
		console.log('Query: getKindergartenApplications');
		this.shapeInquiryObjectIds(input);
		return await this.applicationService.getKindergartenApplications(authMember, input);
	}

	@Roles(MemberType.SUPER_ADMIN)
	@UseGuards(RolesGuard)
	@Query(() => Applications)
	public async getAllApplicationsForAdmin(@Args('input') input: ApplicationsInquiry): Promise<Applications> {
		console.log('Query: getAllApplicationsForAdmin');
		this.shapeInquiryObjectIds(input);
		return await this.applicationService.getAllApplicationsForAdmin(input);
	}

	private shapeInquiryObjectIds(input: ApplicationsInquiry): void {
		if (!input.search) return;
		if (input.search.parentId) input.search.parentId = shapeIntoMongoObjectId(input.search.parentId);
		if (input.search.kindergartenId) input.search.kindergartenId = shapeIntoMongoObjectId(input.search.kindergartenId);
		if (input.search.kindergartenOwnerId) {
			input.search.kindergartenOwnerId = shapeIntoMongoObjectId(input.search.kindergartenOwnerId);
		}
	}
}
