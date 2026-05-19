import { BadRequestException, ForbiddenException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Direction, Message } from '../../libs/enums/common.enum';
import { MemberStatus, MemberType } from '../../libs/enums/member.enum';
import { KindergartenStatus } from '../../libs/enums/kindergarten.enum';
import { StaffRole, StaffStatus } from '../../libs/enums/kindergarten-staff.enum';
import { T } from '../../libs/types/common';
import { Kindergarten } from '../../libs/dto/kindergarten/kindergarten';
import { Member } from '../../libs/dto/member/member';
import { KindergartenStaff, KindergartenStaffs, StaffCandidates } from '../../libs/dto/kindergarten-staff/kindergarten-staff';
import {
	KindergartenStaffInput,
	KindergartenStaffsInquiry,
	StaffCandidatesInquiry,
} from '../../libs/dto/kindergarten-staff/kindergarten-staff.input';
import { KindergartenStaffUpdate } from '../../libs/dto/kindergarten-staff/kindergarten-staff.update';

@Injectable()
export class KindergartenStaffService {
	constructor(
		@InjectModel('KindergartenStaff') private readonly kindergartenStaffModel: Model<KindergartenStaff>,
		@InjectModel('Kindergarten') private readonly kindergartenModel: Model<Kindergarten>,
		@InjectModel('Member') private readonly memberModel: Model<Member>,
	) {}

	public async createKindergartenStaff(authMember: Member, input: KindergartenStaffInput): Promise<KindergartenStaff> {
		this.assertRegularStaffRole(input.staffRole);
		await this.assertCanManageStaff(authMember, input.kindergartenId);
		await this.validateKindergarten(input.kindergartenId);
		await this.validateStaffMember(input.memberId, input.staffRole);

		try {
			return await this.kindergartenStaffModel.create(input);
		} catch (err) {
			console.log('Error, Service.model:', err.message);
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}

	public async updateKindergartenStaff(authMember: Member, input: KindergartenStaffUpdate): Promise<KindergartenStaff> {
		const target = await this.kindergartenStaffModel.findById(input._id).exec();
		if (!target) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		await this.assertCanManageStaff(authMember, target.kindergartenId);
		if (target.staffRole === StaffRole.OWNER) throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);
		if (input.staffRole) this.assertRegularStaffRole(input.staffRole);
		if (input.staffRole) await this.validateStaffMember(target.memberId, input.staffRole);

		const result = await this.kindergartenStaffModel.findByIdAndUpdate(input._id, input, { new: true }).exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

		return result;
	}

	public async removeKindergartenStaff(authMember: Member, kindergartenStaffId: ObjectId): Promise<KindergartenStaff> {
		const target = await this.kindergartenStaffModel.findById(kindergartenStaffId).exec();
		if (!target) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		await this.assertCanManageStaff(authMember, target.kindergartenId);
		if (target.staffRole === StaffRole.OWNER) throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);

		const result = await this.kindergartenStaffModel
			.findByIdAndUpdate(kindergartenStaffId, { staffStatus: StaffStatus.REMOVED }, { new: true })
			.exec();
		if (!result) throw new InternalServerErrorException(Message.REMOVE_FAILED);

		return result;
	}

	public async getKindergartenStaffs(authMember: Member, input: KindergartenStaffsInquiry): Promise<KindergartenStaffs> {
		const match: T = {};
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };
		const { kindergartenId, memberId, staffRole, staffStatus } = input.search;

		if (kindergartenId) match.kindergartenId = kindergartenId;
		if (memberId) match.memberId = memberId;
		if (staffRole) match.staffRole = staffRole;
		if (staffStatus) match.staffStatus = staffStatus;

		if (authMember.memberType === MemberType.KINDERGARTEN_ADMIN) {
			if (!kindergartenId) throw new BadRequestException(Message.BAD_REQUEST);
			await this.assertCanManageStaff(authMember, kindergartenId);
		}

		const result = await this.kindergartenStaffModel
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

	public async getKindergartenStaff(authMember: Member, kindergartenStaffId: ObjectId): Promise<KindergartenStaff> {
		const target = await this.kindergartenStaffModel.findById(kindergartenStaffId).lean().exec();
		if (!target) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		await this.assertCanManageStaff(authMember, target.kindergartenId);

		return target;
	}

	public async searchStaffCandidates(authMember: Member, input: StaffCandidatesInquiry): Promise<StaffCandidates> {
		await this.validateKindergarten(input.kindergartenId);
		await this.assertCanManageStaff(authMember, input.kindergartenId);

		if (input.staffRole === StaffRole.OWNER) throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);

		const searchText = input.searchText.trim();
		if (!searchText) throw new BadRequestException(Message.BAD_REQUEST);

		const page = Math.max(input.page || 1, 1);
		const limit = Math.min(Math.max(input.limit || 10, 1), 50);
		const memberTypes =
			input.staffRole === StaffRole.TEACHER
				? [MemberType.TEACHER]
				: input.staffRole === StaffRole.ADMIN
					? [MemberType.KINDERGARTEN_ADMIN]
					: [MemberType.TEACHER, MemberType.KINDERGARTEN_ADMIN];

		const linkedStaff = await this.kindergartenStaffModel
			.find({
				kindergartenId: input.kindergartenId,
				staffStatus: { $ne: StaffStatus.REMOVED },
			})
			.select('memberId')
			.lean()
			.exec();
		const linkedMemberIds = linkedStaff.map((staff) => staff.memberId);
		const safeRegex = new RegExp(this.escapeRegex(searchText), 'i');
		const match: T = {
			memberStatus: MemberStatus.ACTIVE,
			memberType: { $in: memberTypes },
			$or: [{ memberNick: safeRegex }, { memberPhone: safeRegex }],
		};

		if (linkedMemberIds.length) match._id = { $nin: linkedMemberIds };

		const result = await this.memberModel
			.aggregate([
				{ $match: match },
				{ $sort: { memberNick: Direction.ASC } },
				{
					$facet: {
						list: [
							{ $skip: (page - 1) * limit },
							{ $limit: limit },
							{
								$project: {
									_id: 1,
									memberNick: 1,
									memberPhone: 1,
									memberType: 1,
									memberStatus: 1,
									memberImage: 1,
								},
							},
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();

		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return result[0];
	}

	private async assertCanManageStaff(authMember: Member, kindergartenId: ObjectId): Promise<void> {
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

	private async validateStaffMember(memberId: ObjectId, staffRole: StaffRole): Promise<void> {
		this.assertRegularStaffRole(staffRole);

		const member = await this.memberModel.findOne({ _id: memberId, memberStatus: MemberStatus.ACTIVE }).exec();
		if (!member) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		if (![MemberType.TEACHER, MemberType.KINDERGARTEN_ADMIN].includes(member.memberType)) {
			throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);
		}

		if (staffRole === StaffRole.ADMIN && member.memberType !== MemberType.KINDERGARTEN_ADMIN) {
			throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);
		}

		if (staffRole === StaffRole.TEACHER && member.memberType !== MemberType.TEACHER) {
			throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);
		}
	}

	private assertRegularStaffRole(staffRole: StaffRole): void {
		if (staffRole === StaffRole.OWNER) throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);
	}

	private escapeRegex(value: string): string {
		return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	}
}
