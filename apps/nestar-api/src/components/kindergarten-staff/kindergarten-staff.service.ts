import { BadRequestException, ForbiddenException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Direction, Message } from '../../libs/enums/common.enum';
import { MemberType } from '../../libs/enums/member.enum';
import { KindergartenStatus } from '../../libs/enums/kindergarten.enum';
import { StaffRole, StaffStatus } from '../../libs/enums/kindergarten-staff.enum';
import { T } from '../../libs/types/common';
import { Kindergarten } from '../../libs/dto/kindergarten/kindergarten';
import { Member } from '../../libs/dto/member/member';
import { KindergartenStaff, KindergartenStaffs } from '../../libs/dto/kindergarten-staff/kindergarten-staff';
import {
	KindergartenStaffInput,
	KindergartenStaffsInquiry,
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
		if (input.staffRole) await this.validateStaffMember(target.memberId, input.staffRole);

		const result = await this.kindergartenStaffModel.findByIdAndUpdate(input._id, input, { new: true }).exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

		return result;
	}

	public async removeKindergartenStaff(authMember: Member, kindergartenStaffId: ObjectId): Promise<KindergartenStaff> {
		const target = await this.kindergartenStaffModel.findById(kindergartenStaffId).exec();
		if (!target) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		await this.assertCanManageStaff(authMember, target.kindergartenId);

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
		const member = await this.memberModel.findOne({ _id: memberId }).exec();
		if (!member) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		if (![MemberType.TEACHER, MemberType.KINDERGARTEN_ADMIN].includes(member.memberType)) {
			throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);
		}

		if ([StaffRole.OWNER, StaffRole.ADMIN].includes(staffRole) && member.memberType !== MemberType.KINDERGARTEN_ADMIN) {
			throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);
		}

		if (staffRole === StaffRole.TEACHER && member.memberType !== MemberType.TEACHER) {
			throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);
		}
	}
}
