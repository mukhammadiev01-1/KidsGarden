import { BadRequestException, ForbiddenException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { AttendanceStatus } from '../../libs/enums/attendance.enum';
import { ChildStatus } from '../../libs/enums/child.enum';
import { Direction, Message } from '../../libs/enums/common.enum';
import { GroupStatus } from '../../libs/enums/group.enum';
import { StaffRole, StaffStatus } from '../../libs/enums/kindergarten-staff.enum';
import { MemberType } from '../../libs/enums/member.enum';
import { capPaginationLimit } from '../../libs/config';
import { T } from '../../libs/types/common';
import { Attendance, Attendances } from '../../libs/dto/attendance/attendance';
import {
	AttendanceInput,
	AttendancePaginationInput,
	AttendancesInquiry,
} from '../../libs/dto/attendance/attendance.input';
import { AttendanceUpdate } from '../../libs/dto/attendance/attendance.update';
import { Child } from '../../libs/dto/child/child';
import { Group } from '../../libs/dto/group/group';
import { KindergartenStaff } from '../../libs/dto/kindergarten-staff/kindergarten-staff';
import { Member } from '../../libs/dto/member/member';

@Injectable()
export class AttendanceService {
	private readonly attendanceListMaxLimit = 100;

	constructor(
		@InjectModel('Attendance') private readonly attendanceModel: Model<Attendance>,
		@InjectModel('Child') private readonly childModel: Model<Child>,
		@InjectModel('Group') private readonly groupModel: Model<Group>,
		@InjectModel('KindergartenStaff') private readonly kindergartenStaffModel: Model<KindergartenStaff>,
	) {}

	public async markAttendance(authMember: Member, input: AttendanceInput): Promise<Attendance> {
		input.attendanceDate = this.normalizeAttendanceDate(input.attendanceDate);
		input.markedBy = authMember._id;

		const child = await this.validateChild(input.childId);
		this.validateChildRelations(child, input.kindergartenId, input.groupId);
		await this.assertCanManageAttendance(authMember, child);
		await this.assertNoDuplicateAttendance(input.childId, input.attendanceDate);

		try {
			return await this.attendanceModel.create(input);
		} catch (err) {
			console.log('Error, Service.model:', err.message);
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}

	public async updateAttendance(authMember: Member, input: AttendanceUpdate): Promise<Attendance> {
		const target = await this.attendanceModel.findById(input._id).exec();
		if (!target) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		const nextChildId = input.childId ?? target.childId;
		const child = await this.validateChild(nextChildId);
		const nextKindergartenId = input.kindergartenId ?? target.kindergartenId;
		const nextGroupId = input.groupId ?? target.groupId;
		const nextAttendanceDate = input.attendanceDate
			? this.normalizeAttendanceDate(input.attendanceDate)
			: target.attendanceDate;

		this.validateChildRelations(child, nextKindergartenId, nextGroupId);
		await this.assertCanManageAttendance(authMember, child);

		if (
			nextChildId.toString() !== target.childId.toString() ||
			nextAttendanceDate.getTime() !== target.attendanceDate.getTime()
		) {
			await this.assertNoDuplicateAttendance(nextChildId, nextAttendanceDate, target._id);
		}

		input.childId = nextChildId;
		input.kindergartenId = nextKindergartenId;
		input.groupId = nextGroupId;
		input.attendanceDate = nextAttendanceDate;
		input.markedBy = authMember._id;

		const result = await this.attendanceModel.findByIdAndUpdate(input._id, input, { new: true }).exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

		return result;
	}

	public async removeAttendance(authMember: Member, attendanceId: ObjectId): Promise<Attendance> {
		const target = await this.attendanceModel.findById(attendanceId).exec();
		if (!target) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		const child = await this.validateChild(target.childId);
		await this.assertCanManageAttendance(authMember, child);

		const result = await this.attendanceModel.findByIdAndDelete(attendanceId).exec();
		if (!result) throw new InternalServerErrorException(Message.REMOVE_FAILED);

		return result;
	}

	public async getAttendances(authMember: Member, input: AttendancesInquiry): Promise<Attendances> {
		const match: T = {};
		const sort: T = { [input?.sort ?? 'attendanceDate']: input?.direction ?? Direction.DESC };
		const { childId, kindergartenId, groupId, attendanceDate, attendanceStatus } = input.search;

		if (childId) match.childId = childId;
		if (kindergartenId) match.kindergartenId = kindergartenId;
		if (groupId) match.groupId = groupId;
		if (attendanceDate) match.attendanceDate = this.normalizeAttendanceDate(attendanceDate);
		if (attendanceStatus) match.attendanceStatus = attendanceStatus;

		await this.shapeAccessMatch(authMember, match);

		return await this.findAttendances(match, sort, input.page, input.limit);
	}

	public async getChildAttendances(
		authMember: Member,
		childId: ObjectId,
		input: AttendancePaginationInput,
	): Promise<Attendances> {
		const child = await this.validateChild(childId);
		await this.assertCanReadAttendance(authMember, child);

		const match: T = { childId };
		this.shapePaginationFilters(match, input);

		return await this.findAttendances(match, { attendanceDate: Direction.DESC }, input.page, input.limit);
	}

	public async getGroupAttendances(
		authMember: Member,
		groupId: ObjectId,
		input: AttendancePaginationInput,
	): Promise<Attendances> {
		const group = await this.validateGroup(groupId);

		if (authMember.memberType === MemberType.TEACHER) {
			this.assertTeacherCanReadGroup(authMember, group);
		} else {
			await this.assertCanManageKindergartenAttendance(authMember, group.kindergartenId);
		}

		const match: T = { groupId };
		this.shapePaginationFilters(match, input);

		return await this.findAttendances(match, { attendanceDate: Direction.DESC }, input.page, input.limit);
	}

	private async findAttendances(match: T, sort: T, page: number, limit: number): Promise<Attendances> {
		const cappedLimit = capPaginationLimit(limit, this.attendanceListMaxLimit);
		const result = await this.attendanceModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [{ $skip: (page - 1) * cappedLimit }, { $limit: cappedLimit }],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();

		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return result[0];
	}

	private async shapeAccessMatch(authMember: Member, match: T): Promise<void> {
		if (authMember.memberType === MemberType.SUPER_ADMIN) return;

		if (authMember.memberType === MemberType.KINDERGARTEN_ADMIN) {
			const kindergartenIds = await this.getManagedKindergartenIds(authMember._id);
			match.kindergartenId = match.kindergartenId
				? { $in: kindergartenIds.filter((kindergartenId) => kindergartenId.toString() === match.kindergartenId.toString()) }
				: { $in: kindergartenIds };
			return;
		}

		if (authMember.memberType === MemberType.TEACHER) {
			const groupIds = await this.getTeachingGroupIds(authMember._id);
			match.groupId = match.groupId
				? { $in: groupIds.filter((groupId) => groupId.toString() === match.groupId.toString()) }
				: { $in: groupIds };
			return;
		}

		if (authMember.memberType === MemberType.PARENT) {
			const childIds = await this.getParentChildIds(authMember._id);
			match.childId = match.childId
				? { $in: childIds.filter((childId) => childId.toString() === match.childId.toString()) }
				: { $in: childIds };
			return;
		}

		throw new ForbiddenException(Message.ONLY_SPECIFIC_ROLES_ALLOWED);
	}

	private async assertCanManageAttendance(authMember: Member, child: Child): Promise<void> {
		if (authMember.memberType === MemberType.TEACHER) {
			const group = await this.validateGroup(child.groupId);
			this.assertTeacherCanReadGroup(authMember, group);
			return;
		}

		await this.assertCanManageKindergartenAttendance(authMember, child.kindergartenId);
	}

	private async assertCanReadAttendance(authMember: Member, child: Child): Promise<void> {
		if (authMember.memberType === MemberType.PARENT && child.parentId.toString() === authMember._id.toString()) return;
		if (authMember.memberType === MemberType.TEACHER) {
			const group = await this.validateGroup(child.groupId);
			this.assertTeacherCanReadGroup(authMember, group);
			return;
		}

		await this.assertCanManageKindergartenAttendance(authMember, child.kindergartenId);
	}

	private async assertCanManageKindergartenAttendance(authMember: Member, kindergartenId: ObjectId): Promise<void> {
		if (authMember.memberType === MemberType.SUPER_ADMIN) return;

		if (authMember.memberType !== MemberType.KINDERGARTEN_ADMIN) {
			throw new ForbiddenException(Message.ONLY_SPECIFIC_ROLES_ALLOWED);
		}

		const staffRecord = await this.kindergartenStaffModel
			.findOne({
				kindergartenId,
				memberId: authMember._id,
				staffStatus: StaffStatus.ACTIVE,
				staffRole: { $in: [StaffRole.OWNER, StaffRole.ADMIN] },
			})
			.exec();

		if (!staffRecord) throw new ForbiddenException(Message.NOT_ALLOWED_REQUEST);
	}

	private async validateChild(childId: ObjectId): Promise<Child> {
		const child = await this.childModel.findOne({ _id: childId, childStatus: ChildStatus.ACTIVE }).exec();
		if (!child) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return child;
	}

	private async validateGroup(groupId: ObjectId): Promise<Group> {
		const group = await this.groupModel
			.findOne({ _id: groupId, groupStatus: { $in: [GroupStatus.ACTIVE, GroupStatus.FULL] } })
			.exec();
		if (!group) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return group;
	}

	private validateChildRelations(child: Child, kindergartenId: ObjectId, groupId: ObjectId): void {
		if (child.kindergartenId.toString() !== kindergartenId.toString()) throw new BadRequestException(Message.BAD_REQUEST);
		if (child.groupId.toString() !== groupId.toString()) throw new BadRequestException(Message.BAD_REQUEST);
	}

	private assertTeacherCanReadGroup(authMember: Member, group: Group): void {
		const canRead = group.teacherIds.some((teacherId: ObjectId) => teacherId.toString() === authMember._id.toString());
		if (!canRead) throw new ForbiddenException(Message.NOT_ALLOWED_REQUEST);
	}

	private async assertNoDuplicateAttendance(childId: ObjectId, attendanceDate: Date, excludedAttendanceId?: ObjectId): Promise<void> {
		const search: T = { childId, attendanceDate };
		if (excludedAttendanceId) search._id = { $ne: excludedAttendanceId };

		const duplicate = await this.attendanceModel.findOne(search).exec();
		if (duplicate) throw new BadRequestException(Message.CREATE_FAILED);
	}

	private shapePaginationFilters(match: T, input: AttendancePaginationInput): void {
		if (input.attendanceDate) match.attendanceDate = this.normalizeAttendanceDate(input.attendanceDate);
		if (input.attendanceStatus) match.attendanceStatus = input.attendanceStatus;
	}

	private normalizeAttendanceDate(date: Date): Date {
		const attendanceDate = new Date(date);
		attendanceDate.setHours(0, 0, 0, 0);
		return attendanceDate;
	}

	private async getManagedKindergartenIds(memberId: ObjectId): Promise<ObjectId[]> {
		const staffRecords = await this.kindergartenStaffModel
			.find({
				memberId,
				staffStatus: StaffStatus.ACTIVE,
				staffRole: { $in: [StaffRole.OWNER, StaffRole.ADMIN] },
			})
			.exec();

		return staffRecords.map((staff) => staff.kindergartenId);
	}

	private async getTeachingGroupIds(memberId: ObjectId): Promise<ObjectId[]> {
		const groups = await this.groupModel
			.find({
				teacherIds: memberId,
				groupStatus: { $in: [GroupStatus.ACTIVE, GroupStatus.FULL] },
			})
			.exec();

		return groups.map((group) => group._id);
	}

	private async getParentChildIds(parentId: ObjectId): Promise<ObjectId[]> {
		const children = await this.childModel.find({ parentId, childStatus: ChildStatus.ACTIVE }).exec();
		return children.map((child) => child._id);
	}
}
