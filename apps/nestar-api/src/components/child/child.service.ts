import { BadRequestException, ForbiddenException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { ChildGender, ChildStatus } from '../../libs/enums/child.enum';
import { Direction, Message } from '../../libs/enums/common.enum';
import { GroupStatus } from '../../libs/enums/group.enum';
import { KindergartenStatus } from '../../libs/enums/kindergarten.enum';
import { StaffRole, StaffStatus } from '../../libs/enums/kindergarten-staff.enum';
import { MemberStatus, MemberType } from '../../libs/enums/member.enum';
import { T } from '../../libs/types/common';
import { Child, Children } from '../../libs/dto/child/child';
import { ChildInput, ChildrenInquiry } from '../../libs/dto/child/child.input';
import { ChildUpdate } from '../../libs/dto/child/child.update';
import { Group } from '../../libs/dto/group/group';
import { Kindergarten } from '../../libs/dto/kindergarten/kindergarten';
import { KindergartenStaff } from '../../libs/dto/kindergarten-staff/kindergarten-staff';
import { Member } from '../../libs/dto/member/member';
import { capPaginationLimit, escapeRegex } from '../../libs/config';

@Injectable()
export class ChildService {
	private readonly childrenListMaxLimit = 100;

	constructor(
		@InjectModel('Child') private readonly childModel: Model<Child>,
		@InjectModel('Group') private readonly groupModel: Model<Group>,
		@InjectModel('Kindergarten') private readonly kindergartenModel: Model<Kindergarten>,
		@InjectModel('KindergartenStaff') private readonly kindergartenStaffModel: Model<KindergartenStaff>,
		@InjectModel('Member') private readonly memberModel: Model<Member>,
	) {}

	public async createChild(authMember: Member, input: ChildInput): Promise<Child> {
		await this.assertCanManageChildren(authMember, input.kindergartenId);
		await this.validateParent(input.parentId);
		await this.validateKindergarten(input.kindergartenId);
		const group = await this.validateGroup(input.kindergartenId, input.groupId);
		await this.assertNoDuplicateActiveChild(input);
		await this.assertGroupHasCapacity(group, input.childStatus ?? ChildStatus.ACTIVE);

		try {
			return await this.childModel.create(input);
		} catch (err) {
			console.log('Error, Service.model:', err.message);
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}

	public async updateChild(authMember: Member, input: ChildUpdate): Promise<Child> {
		const target = await this.childModel.findById(input._id).exec();
		if (!target) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		const nextKindergartenId = input.kindergartenId ?? target.kindergartenId;
		const nextGroupId = input.groupId ?? target.groupId;
		const nextParentId = input.parentId ?? target.parentId;
		const nextStatus = input.childStatus ?? target.childStatus;
		const nextFullName = input.childFullName ?? target.childFullName;
		const nextBirthDate = input.childBirthDate ?? target.childBirthDate;

		await this.assertCanManageChildren(authMember, target.kindergartenId);
		if (input.kindergartenId && input.kindergartenId.toString() !== target.kindergartenId.toString()) {
			await this.assertCanManageChildren(authMember, input.kindergartenId);
		}

		await this.validateParent(nextParentId);
		await this.validateKindergarten(nextKindergartenId);
		const group = await this.validateGroup(nextKindergartenId, nextGroupId);
		await this.assertNoDuplicateActiveChild(
			{
				parentId: nextParentId,
				kindergartenId: nextKindergartenId,
				childFullName: nextFullName,
				childBirthDate: nextBirthDate,
				childGender: input.childGender ?? target.childGender,
				groupId: nextGroupId,
			},
			target._id,
		);
		await this.assertGroupHasCapacity(group, nextStatus, target._id);

		const result = await this.childModel.findByIdAndUpdate(input._id, input, { new: true }).exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

		return result;
	}

	public async removeChild(authMember: Member, childId: ObjectId): Promise<Child> {
		const target = await this.childModel.findById(childId).exec();
		if (!target) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		await this.assertCanManageChildren(authMember, target.kindergartenId);

		const result = await this.childModel
			.findByIdAndUpdate(childId, { childStatus: ChildStatus.INACTIVE }, { new: true })
			.exec();
		if (!result) throw new InternalServerErrorException(Message.REMOVE_FAILED);

		return result;
	}

	public async getChildren(authMember: Member, input: ChildrenInquiry): Promise<Children> {
		const match: T = {};
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };
		const { parentId, kindergartenId, groupId, childStatus, text } = input.search;
		const limit = capPaginationLimit(input.limit, this.childrenListMaxLimit);

		if (parentId) match.parentId = parentId;
		if (kindergartenId) match.kindergartenId = kindergartenId;
		if (groupId) match.groupId = groupId;
		if (childStatus) match.childStatus = childStatus;
		if (text) match.childFullName = { $regex: new RegExp(escapeRegex(text), 'i') };

		await this.shapeAccessMatch(authMember, match);

		const result = await this.childModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [{ $skip: (input.page - 1) * limit }, { $limit: limit }],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();

		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return result[0];
	}

	public async getChild(authMember: Member, childId: ObjectId): Promise<Child> {
		const target = await this.childModel.findById(childId).lean().exec();
		if (!target) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		await this.assertCanReadChild(authMember, target);

		return target;
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
			match.parentId = authMember._id;
			return;
		}

		throw new ForbiddenException(Message.ONLY_SPECIFIC_ROLES_ALLOWED);
	}

	private async assertCanReadChild(authMember: Member, child: Child): Promise<void> {
		if (authMember.memberType === MemberType.SUPER_ADMIN) return;

		if (authMember.memberType === MemberType.KINDERGARTEN_ADMIN) {
			await this.assertCanManageChildren(authMember, child.kindergartenId);
			return;
		}

		if (authMember.memberType === MemberType.TEACHER) {
			const canRead = await this.groupModel.findOne({ _id: child.groupId, teacherIds: authMember._id }).exec();
			if (!canRead) throw new ForbiddenException(Message.NOT_ALLOWED_REQUEST);
			return;
		}

		if (authMember.memberType === MemberType.PARENT && child.parentId.toString() === authMember._id.toString()) return;

		throw new ForbiddenException(Message.NOT_ALLOWED_REQUEST);
	}

	private async assertCanManageChildren(authMember: Member, kindergartenId: ObjectId): Promise<void> {
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

	private async validateParent(parentId: ObjectId): Promise<void> {
		const parent = await this.memberModel
			.findOne({ _id: parentId, memberType: MemberType.PARENT, memberStatus: MemberStatus.ACTIVE })
			.exec();
		if (!parent) throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);
	}

	private async validateKindergarten(kindergartenId: ObjectId): Promise<void> {
		const kindergarten = await this.kindergartenModel
			.findOne({ _id: kindergartenId, kindergartenStatus: KindergartenStatus.ACTIVE })
			.exec();
		if (!kindergarten) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
	}

	private async validateGroup(kindergartenId: ObjectId, groupId: ObjectId): Promise<Group> {
		const group = await this.groupModel
			.findOne({ _id: groupId, groupStatus: { $in: [GroupStatus.ACTIVE, GroupStatus.FULL] } })
			.exec();
		if (!group) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		if (group.kindergartenId.toString() !== kindergartenId.toString()) throw new BadRequestException(Message.BAD_REQUEST);

		return group;
	}

	private async assertNoDuplicateActiveChild(input: ChildInput, excludedChildId?: ObjectId): Promise<void> {
		const search: T = {
			childFullName: input.childFullName,
			childBirthDate: input.childBirthDate,
			parentId: input.parentId,
			kindergartenId: input.kindergartenId,
			childStatus: ChildStatus.ACTIVE,
		};
		if (excludedChildId) search._id = { $ne: excludedChildId };

		const duplicate = await this.childModel.findOne(search).exec();
		if (duplicate) throw new BadRequestException(Message.CREATE_FAILED);
	}

	private async assertGroupHasCapacity(group: Group, childStatus: ChildStatus, excludedChildId?: ObjectId): Promise<void> {
		if (childStatus !== ChildStatus.ACTIVE) return;
		if (group.groupStatus === GroupStatus.FULL) throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);

		const match: T = { groupId: group._id, childStatus: ChildStatus.ACTIVE };
		if (excludedChildId) match._id = { $ne: excludedChildId };

		const activeChildren = await this.childModel.countDocuments(match).exec();
		if (activeChildren >= group.groupCapacity) throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);
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
}
