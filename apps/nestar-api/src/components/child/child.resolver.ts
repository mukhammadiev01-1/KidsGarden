import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import type { ObjectId } from 'mongoose';
import { ChildService } from './child.service';
import { Child, Children } from '../../libs/dto/child/child';
import { ChildInput, ChildrenInquiry } from '../../libs/dto/child/child.input';
import { ChildUpdate } from '../../libs/dto/child/child.update';
import { Member } from '../../libs/dto/member/member';
import { MemberType } from '../../libs/enums/member.enum';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@Resolver()
export class ChildResolver {
	constructor(private readonly childService: ChildService) {}

	@Roles(MemberType.KINDERGARTEN_ADMIN, MemberType.SUPER_ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => Child)
	public async createChild(@Args('input') input: ChildInput, @AuthMember() authMember: Member): Promise<Child> {
		console.log('Mutation: createChild');
		input.parentId = shapeIntoMongoObjectId(input.parentId);
		input.kindergartenId = shapeIntoMongoObjectId(input.kindergartenId);
		input.groupId = shapeIntoMongoObjectId(input.groupId);
		return await this.childService.createChild(authMember, input);
	}

	@Roles(MemberType.KINDERGARTEN_ADMIN, MemberType.SUPER_ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => Child)
	public async updateChild(@Args('input') input: ChildUpdate, @AuthMember() authMember: Member): Promise<Child> {
		console.log('Mutation: updateChild');
		input._id = shapeIntoMongoObjectId(input._id);
		if (input.parentId) input.parentId = shapeIntoMongoObjectId(input.parentId);
		if (input.kindergartenId) input.kindergartenId = shapeIntoMongoObjectId(input.kindergartenId);
		if (input.groupId) input.groupId = shapeIntoMongoObjectId(input.groupId);
		return await this.childService.updateChild(authMember, input);
	}

	@Roles(MemberType.KINDERGARTEN_ADMIN, MemberType.SUPER_ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => Child)
	public async removeChild(@Args('childId') input: string, @AuthMember() authMember: Member): Promise<Child> {
		console.log('Mutation: removeChild');
		const childId = shapeIntoMongoObjectId(input);
		return await this.childService.removeChild(authMember, childId);
	}

	@Roles(MemberType.PARENT, MemberType.TEACHER, MemberType.KINDERGARTEN_ADMIN, MemberType.SUPER_ADMIN)
	@UseGuards(RolesGuard)
	@Query(() => Children)
	public async getChildren(@Args('input') input: ChildrenInquiry, @AuthMember() authMember: Member): Promise<Children> {
		console.log('Query: getChildren');
		if (input.search.parentId) input.search.parentId = shapeIntoMongoObjectId(input.search.parentId);
		if (input.search.kindergartenId) input.search.kindergartenId = shapeIntoMongoObjectId(input.search.kindergartenId);
		if (input.search.groupId) input.search.groupId = shapeIntoMongoObjectId(input.search.groupId);
		return await this.childService.getChildren(authMember, input);
	}

	@Roles(MemberType.PARENT, MemberType.TEACHER, MemberType.KINDERGARTEN_ADMIN, MemberType.SUPER_ADMIN)
	@UseGuards(RolesGuard)
	@Query(() => Child)
	public async getChild(@Args('childId') input: string, @AuthMember() authMember: Member): Promise<Child> {
		console.log('Query: getChild');
		const childId = shapeIntoMongoObjectId(input);
		return await this.childService.getChild(authMember, childId);
	}
}
