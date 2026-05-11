import { BadRequestException, ForbiddenException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Direction, Message } from '../../libs/enums/common.enum';
import { GroupStatus } from '../../libs/enums/group.enum';
import { KindergartenStatus } from '../../libs/enums/kindergarten.enum';
import { StaffRole, StaffStatus } from '../../libs/enums/kindergarten-staff.enum';
import { MemberType } from '../../libs/enums/member.enum';
import { T } from '../../libs/types/common';
import { Group, Groups } from '../../libs/dto/group/group';
import { GroupInput, GroupsInquiry } from '../../libs/dto/group/group.input';
import { GroupUpdate } from '../../libs/dto/group/group.update';
import { Kindergarten } from '../../libs/dto/kindergarten/kindergarten';
import { KindergartenStaff } from '../../libs/dto/kindergarten-staff/kindergarten-staff';
import { Member } from '../../libs/dto/member/member';

@Injectable()
export class GroupService {
	constructor(
		@InjectModel('Group') private readonly groupModel: Model<Group>,
		@InjectModel('Kindergarten') private readonly kindergartenModel: Model<Kindergarten>,
		@InjectModel('KindergartenStaff') private readonly kindergartenStaffModel: Model<KindergartenStaff>,
		@InjectModel('Member') private readonly memberModel: Model<Member>,
	) {}

	public async createGroup(authMember: Member, input: GroupInput): Promise<Group> {
		await this.assertCanManageGroups(authMember, input.kindergartenId);
		await this.validateKindergarten(input.kindergartenId);
		this.validateCapacity(input.groupCapacity);
		await this.validateTeachers(input.kindergartenId, input.teacherIds ?? []);

		try {
			return await this.groupModel.create(input);
		} catch (err) {
			console.log('Error, Service.model:', err.message);
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}

	public async updateGroup(authMember: Member, input: GroupUpdate): Promise<Group> {
		const target = await this.groupModel.findById(input._id).exec();
		if (!target) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		await this.assertCanManageGroups(authMember, target.kindergartenId);
		if (typeof input.groupCapacity === 'number') this.validateCapacity(input.groupCapacity);
		if (input.teacherIds) await this.validateTeachers(target.kindergartenId, input.teacherIds);

		const result = await this.groupModel.findByIdAndUpdate(input._id, input, { new: true }).exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

		return result;
	}

	public async removeGroup(authMember: Member, groupId: ObjectId): Promise<Group> {
		const target = await this.groupModel.findById(groupId).exec();
		if (!target) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		await this.assertCanManageGroups(authMember, target.kindergartenId);

		const result = await this.groupModel
			.findByIdAndUpdate(groupId, { groupStatus: GroupStatus.ARCHIVED }, { new: true })
			.exec();
		if (!result) throw new InternalServerErrorException(Message.REMOVE_FAILED);

		return result;
	}

	public async getGroups(authMember: Member, input: GroupsInquiry): Promise<Groups> {
		const match: T = {};
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };
		const { kindergartenId, teacherId, groupStatus, text } = input.search;

		if (kindergartenId) match.kindergartenId = kindergartenId;
		if (teacherId) match.teacherIds = teacherId;
		if (groupStatus) match.groupStatus = groupStatus;
		if (text) match.groupName = { $regex: new RegExp(text, 'i') };

		if (authMember.memberType === MemberType.KINDERGARTEN_ADMIN) {
			if (!kindergartenId) throw new BadRequestException(Message.BAD_REQUEST);
			await this.assertCanManageGroups(authMember, kindergartenId);
		} else if (authMember.memberType === MemberType.TEACHER) {
			match.teacherIds = authMember._id;
		}

		const result = await this.groupModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [{ $skip: (input.page - 1) * input.limit }, { $limit: input.limit }],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();

		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return result[0];
	}

	public async getGroup(authMember: Member, groupId: ObjectId): Promise<Group> {
		const target = await this.groupModel.findById(groupId).lean().exec();
		if (!target) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		if (authMember.memberType === MemberType.TEACHER) {
			const canRead = target.teacherIds.some((teacherId: ObjectId) => teacherId.toString() === authMember._id.toString());
			if (!canRead) throw new ForbiddenException(Message.NOT_ALLOWED_REQUEST);
		} else {
			await this.assertCanManageGroups(authMember, target.kindergartenId);
		}

		return target;
	}

	private async assertCanManageGroups(authMember: Member, kindergartenId: ObjectId): Promise<void> {
		if (authMember.memberType === MemberType.SUPER_ADMIN) return;

		if (authMember.memberType !== MemberType.KINDERGARTEN_ADMIN) {
			throw new ForbiddenException(Message.ONLY_SPECIFIC_ROLES_ALLOWED);
		}

		const ownerRecord = await this.kindergartenStaffModel
			.findOne({
				kindergartenId,
				memberId: authMember._id,
				staffStatus: StaffStatus.ACTIVE,
				staffRole: { $in: [StaffRole.OWNER, StaffRole.ADMIN] },
			})
			.exec();

		if (!ownerRecord) throw new ForbiddenException(Message.NOT_ALLOWED_REQUEST);
	}

	private async validateKindergarten(kindergartenId: ObjectId): Promise<void> {
		const target = await this.kindergartenModel
			.findOne({ _id: kindergartenId, kindergartenStatus: KindergartenStatus.ACTIVE })
			.exec();
		if (!target) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
	}

	private validateCapacity(groupCapacity: number): void {
		if (groupCapacity <= 0) throw new BadRequestException(Message.BAD_REQUEST);
	}

	private async validateTeachers(kindergartenId: ObjectId, teacherIds: ObjectId[]): Promise<void> {
		if (!teacherIds.length) return;

		const uniqueTeacherIds = [...new Set(teacherIds.map((teacherId) => teacherId.toString()))];
		if (uniqueTeacherIds.length !== teacherIds.length) throw new BadRequestException(Message.BAD_REQUEST);

		const teachers = await this.memberModel.find({ _id: { $in: teacherIds }, memberType: MemberType.TEACHER }).exec();
		if (teachers.length !== teacherIds.length) throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);

		const staffRecords = await this.kindergartenStaffModel
			.find({
				kindergartenId,
				memberId: { $in: teacherIds },
				staffRole: StaffRole.TEACHER,
				staffStatus: StaffStatus.ACTIVE,
			})
			.exec();
		if (staffRecords.length !== teacherIds.length) throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);
	}
}
