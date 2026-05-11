import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import type { ObjectId } from 'mongoose';
import { GroupService } from './group.service';
import { Group, Groups } from '../../libs/dto/group/group';
import { GroupInput, GroupsInquiry } from '../../libs/dto/group/group.input';
import { GroupUpdate } from '../../libs/dto/group/group.update';
import { Member } from '../../libs/dto/member/member';
import { MemberType } from '../../libs/enums/member.enum';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@Resolver()
export class GroupResolver {
	constructor(private readonly groupService: GroupService) {}

	@Roles(MemberType.KINDERGARTEN_ADMIN, MemberType.SUPER_ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => Group)
	public async createGroup(@Args('input') input: GroupInput, @AuthMember() authMember: Member): Promise<Group> {
		console.log('Mutation: createGroup');
		input.kindergartenId = shapeIntoMongoObjectId(input.kindergartenId);
		input.teacherIds = input.teacherIds?.map((teacherId: ObjectId) => shapeIntoMongoObjectId(teacherId));
		return await this.groupService.createGroup(authMember, input);
	}

	@Roles(MemberType.KINDERGARTEN_ADMIN, MemberType.SUPER_ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => Group)
	public async updateGroup(@Args('input') input: GroupUpdate, @AuthMember() authMember: Member): Promise<Group> {
		console.log('Mutation: updateGroup');
		input._id = shapeIntoMongoObjectId(input._id);
		input.teacherIds = input.teacherIds?.map((teacherId: ObjectId) => shapeIntoMongoObjectId(teacherId));
		return await this.groupService.updateGroup(authMember, input);
	}

	@Roles(MemberType.KINDERGARTEN_ADMIN, MemberType.SUPER_ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => Group)
	public async removeGroup(@Args('groupId') input: string, @AuthMember() authMember: Member): Promise<Group> {
		console.log('Mutation: removeGroup');
		const groupId = shapeIntoMongoObjectId(input);
		return await this.groupService.removeGroup(authMember, groupId);
	}

	@Roles(MemberType.TEACHER, MemberType.KINDERGARTEN_ADMIN, MemberType.SUPER_ADMIN)
	@UseGuards(RolesGuard)
	@Query(() => Groups)
	public async getGroups(@Args('input') input: GroupsInquiry, @AuthMember() authMember: Member): Promise<Groups> {
		console.log('Query: getGroups');
		if (input.search.kindergartenId) input.search.kindergartenId = shapeIntoMongoObjectId(input.search.kindergartenId);
		if (input.search.teacherId) input.search.teacherId = shapeIntoMongoObjectId(input.search.teacherId);
		return await this.groupService.getGroups(authMember, input);
	}

	@Roles(MemberType.TEACHER, MemberType.KINDERGARTEN_ADMIN, MemberType.SUPER_ADMIN)
	@UseGuards(RolesGuard)
	@Query(() => Group)
	public async getGroup(@Args('groupId') input: string, @AuthMember() authMember: Member): Promise<Group> {
		console.log('Query: getGroup');
		const groupId = shapeIntoMongoObjectId(input);
		return await this.groupService.getGroup(authMember, groupId);
	}
}
