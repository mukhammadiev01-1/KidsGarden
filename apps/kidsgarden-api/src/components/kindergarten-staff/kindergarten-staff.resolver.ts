import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import type { ObjectId } from 'mongoose';
import { KindergartenStaffService } from './kindergarten-staff.service';
import { KindergartenStaff, KindergartenStaffs, StaffCandidates } from '../../libs/dto/kindergarten-staff/kindergarten-staff';
import {
	KindergartenStaffInput,
	KindergartenStaffsInquiry,
	StaffCandidatesInquiry,
} from '../../libs/dto/kindergarten-staff/kindergarten-staff.input';
import { KindergartenStaffUpdate } from '../../libs/dto/kindergarten-staff/kindergarten-staff.update';
import { Member } from '../../libs/dto/member/member';
import { MemberType } from '../../libs/enums/member.enum';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@Resolver()
export class KindergartenStaffResolver {
	constructor(private readonly kindergartenStaffService: KindergartenStaffService) {}

	@Roles(MemberType.KINDERGARTEN_ADMIN, MemberType.SUPER_ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => KindergartenStaff)
	public async createKindergartenStaff(
		@Args('input') input: KindergartenStaffInput,
		@AuthMember() authMember: Member,
	): Promise<KindergartenStaff> {
		console.log('Mutation: createKindergartenStaff');
		input.kindergartenId = shapeIntoMongoObjectId(input.kindergartenId);
		input.memberId = shapeIntoMongoObjectId(input.memberId);
		return await this.kindergartenStaffService.createKindergartenStaff(authMember, input);
	}

	@Roles(MemberType.KINDERGARTEN_ADMIN, MemberType.SUPER_ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => KindergartenStaff)
	public async updateKindergartenStaff(
		@Args('input') input: KindergartenStaffUpdate,
		@AuthMember() authMember: Member,
	): Promise<KindergartenStaff> {
		console.log('Mutation: updateKindergartenStaff');
		input._id = shapeIntoMongoObjectId(input._id);
		return await this.kindergartenStaffService.updateKindergartenStaff(authMember, input);
	}

	@Roles(MemberType.KINDERGARTEN_ADMIN, MemberType.SUPER_ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => KindergartenStaff)
	public async removeKindergartenStaff(
		@Args('kindergartenStaffId') input: string,
		@AuthMember() authMember: Member,
	): Promise<KindergartenStaff> {
		console.log('Mutation: removeKindergartenStaff');
		const kindergartenStaffId = shapeIntoMongoObjectId(input);
		return await this.kindergartenStaffService.removeKindergartenStaff(authMember, kindergartenStaffId);
	}

	@Roles(MemberType.KINDERGARTEN_ADMIN, MemberType.SUPER_ADMIN)
	@UseGuards(RolesGuard)
	@Query(() => KindergartenStaffs)
	public async getKindergartenStaffs(
		@Args('input') input: KindergartenStaffsInquiry,
		@AuthMember() authMember: Member,
	): Promise<KindergartenStaffs> {
		console.log('Query: getKindergartenStaffs');
		if (input.search.kindergartenId) input.search.kindergartenId = shapeIntoMongoObjectId(input.search.kindergartenId);
		if (input.search.memberId) input.search.memberId = shapeIntoMongoObjectId(input.search.memberId);
		return await this.kindergartenStaffService.getKindergartenStaffs(authMember, input);
	}

	@Roles(MemberType.KINDERGARTEN_ADMIN, MemberType.SUPER_ADMIN)
	@UseGuards(RolesGuard)
	@Query(() => KindergartenStaff)
	public async getKindergartenStaff(
		@Args('kindergartenStaffId') input: string,
		@AuthMember() authMember: Member,
	): Promise<KindergartenStaff> {
		console.log('Query: getKindergartenStaff');
		const kindergartenStaffId = shapeIntoMongoObjectId(input);
		return await this.kindergartenStaffService.getKindergartenStaff(authMember, kindergartenStaffId);
	}

	@Roles(MemberType.KINDERGARTEN_ADMIN, MemberType.SUPER_ADMIN)
	@UseGuards(RolesGuard)
	@Query(() => StaffCandidates)
	public async searchStaffCandidates(
		@Args('input') input: StaffCandidatesInquiry,
		@AuthMember() authMember: Member,
	): Promise<StaffCandidates> {
		console.log('Query: searchStaffCandidates');
		input.kindergartenId = shapeIntoMongoObjectId(input.kindergartenId);
		return await this.kindergartenStaffService.searchStaffCandidates(authMember, input);
	}
}
