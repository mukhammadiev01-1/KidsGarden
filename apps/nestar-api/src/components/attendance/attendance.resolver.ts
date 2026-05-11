import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import type { ObjectId } from 'mongoose';
import { AttendanceService } from './attendance.service';
import { Attendance, Attendances } from '../../libs/dto/attendance/attendance';
import {
	AttendanceInput,
	AttendancePaginationInput,
	AttendancesInquiry,
} from '../../libs/dto/attendance/attendance.input';
import { AttendanceUpdate } from '../../libs/dto/attendance/attendance.update';
import { Member } from '../../libs/dto/member/member';
import { MemberType } from '../../libs/enums/member.enum';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@Resolver()
export class AttendanceResolver {
	constructor(private readonly attendanceService: AttendanceService) {}

	@Roles(MemberType.TEACHER, MemberType.KINDERGARTEN_ADMIN, MemberType.SUPER_ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => Attendance)
	public async markAttendance(
		@Args('input') input: AttendanceInput,
		@AuthMember() authMember: Member,
	): Promise<Attendance> {
		console.log('Mutation: markAttendance');
		input.childId = shapeIntoMongoObjectId(input.childId);
		input.kindergartenId = shapeIntoMongoObjectId(input.kindergartenId);
		input.groupId = shapeIntoMongoObjectId(input.groupId);
		return await this.attendanceService.markAttendance(authMember, input);
	}

	@Roles(MemberType.TEACHER, MemberType.KINDERGARTEN_ADMIN, MemberType.SUPER_ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => Attendance)
	public async updateAttendance(
		@Args('input') input: AttendanceUpdate,
		@AuthMember() authMember: Member,
	): Promise<Attendance> {
		console.log('Mutation: updateAttendance');
		input._id = shapeIntoMongoObjectId(input._id);
		if (input.childId) input.childId = shapeIntoMongoObjectId(input.childId);
		if (input.kindergartenId) input.kindergartenId = shapeIntoMongoObjectId(input.kindergartenId);
		if (input.groupId) input.groupId = shapeIntoMongoObjectId(input.groupId);
		return await this.attendanceService.updateAttendance(authMember, input);
	}

	@Roles(MemberType.TEACHER, MemberType.KINDERGARTEN_ADMIN, MemberType.SUPER_ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => Attendance)
	public async removeAttendance(
		@Args('attendanceId') input: string,
		@AuthMember() authMember: Member,
	): Promise<Attendance> {
		console.log('Mutation: removeAttendance');
		const attendanceId = shapeIntoMongoObjectId(input);
		return await this.attendanceService.removeAttendance(authMember, attendanceId);
	}

	@Roles(MemberType.PARENT, MemberType.TEACHER, MemberType.KINDERGARTEN_ADMIN, MemberType.SUPER_ADMIN)
	@UseGuards(RolesGuard)
	@Query(() => Attendances)
	public async getAttendances(
		@Args('input') input: AttendancesInquiry,
		@AuthMember() authMember: Member,
	): Promise<Attendances> {
		console.log('Query: getAttendances');
		if (input.search.childId) input.search.childId = shapeIntoMongoObjectId(input.search.childId);
		if (input.search.kindergartenId) input.search.kindergartenId = shapeIntoMongoObjectId(input.search.kindergartenId);
		if (input.search.groupId) input.search.groupId = shapeIntoMongoObjectId(input.search.groupId);
		return await this.attendanceService.getAttendances(authMember, input);
	}

	@Roles(MemberType.PARENT, MemberType.TEACHER, MemberType.KINDERGARTEN_ADMIN, MemberType.SUPER_ADMIN)
	@UseGuards(RolesGuard)
	@Query(() => Attendances)
	public async getChildAttendances(
		@Args('childId') input: string,
		@Args('input') pagination: AttendancePaginationInput,
		@AuthMember() authMember: Member,
	): Promise<Attendances> {
		console.log('Query: getChildAttendances');
		const childId = shapeIntoMongoObjectId(input);
		return await this.attendanceService.getChildAttendances(authMember, childId, pagination);
	}

	@Roles(MemberType.TEACHER, MemberType.KINDERGARTEN_ADMIN, MemberType.SUPER_ADMIN)
	@UseGuards(RolesGuard)
	@Query(() => Attendances)
	public async getGroupAttendances(
		@Args('groupId') input: string,
		@Args('input') pagination: AttendancePaginationInput,
		@AuthMember() authMember: Member,
	): Promise<Attendances> {
		console.log('Query: getGroupAttendances');
		const groupId = shapeIntoMongoObjectId(input);
		return await this.attendanceService.getGroupAttendances(authMember, groupId, pagination);
	}
}
