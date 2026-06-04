import { BadRequestException, ForbiddenException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId, PipelineStage } from 'mongoose';
import {
	capPaginationLimit,
	maxApplicationDocumentSize,
	maxApplicationDocuments,
	memberPreviewProjection,
	validApplicationDocumentMimeTypes,
} from '../../libs/config';
import { Direction, Message } from '../../libs/enums/common.enum';
import { ApplicationStatus } from '../../libs/enums/application.enum';
import { KindergartenStatus } from '../../libs/enums/kindergarten.enum';
import { StaffRole, StaffStatus } from '../../libs/enums/kindergarten-staff.enum';
import { MemberStatus, MemberType } from '../../libs/enums/member.enum';
import { NotificationTargetType, NotificationType } from '../../libs/enums/notification.enum';
import { T } from '../../libs/types/common';
import { Application, Applications } from '../../libs/dto/application/application';
import { ApplicationDocumentInput, ApplicationInput, ApplicationsInquiry } from '../../libs/dto/application/application.input';
import { ApplicationStatusUpdateInput } from '../../libs/dto/application/application.update';
import { Kindergarten } from '../../libs/dto/kindergarten/kindergarten';
import { KindergartenStaff } from '../../libs/dto/kindergarten-staff/kindergarten-staff';
import { Member } from '../../libs/dto/member/member';
import { NotificationInput } from '../../libs/dto/notification/notification.input';
import { NotificationService } from '../notification/notification.service';

const OPEN_APPLICATION_STATUSES = [
	ApplicationStatus.PENDING,
	ApplicationStatus.REVIEWING,
	ApplicationStatus.NEED_MORE_INFO,
];

const FINAL_APPLICATION_STATUSES = [
	ApplicationStatus.APPROVED,
	ApplicationStatus.REJECTED,
	ApplicationStatus.CANCELED,
];

const REVIEWED_APPLICATION_STATUSES = [
	ApplicationStatus.APPROVED,
	ApplicationStatus.REJECTED,
	ApplicationStatus.NEED_MORE_INFO,
	ApplicationStatus.CANCELED,
];

const APPLICATION_STATUS_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
	[ApplicationStatus.PENDING]: [
		ApplicationStatus.REVIEWING,
		ApplicationStatus.APPROVED,
		ApplicationStatus.REJECTED,
		ApplicationStatus.NEED_MORE_INFO,
		ApplicationStatus.CANCELED,
	],
	[ApplicationStatus.REVIEWING]: [
		ApplicationStatus.APPROVED,
		ApplicationStatus.REJECTED,
		ApplicationStatus.NEED_MORE_INFO,
		ApplicationStatus.CANCELED,
	],
	[ApplicationStatus.NEED_MORE_INFO]: [
		ApplicationStatus.REVIEWING,
		ApplicationStatus.APPROVED,
		ApplicationStatus.REJECTED,
		ApplicationStatus.CANCELED,
	],
	[ApplicationStatus.APPROVED]: [],
	[ApplicationStatus.REJECTED]: [],
	[ApplicationStatus.CANCELED]: [],
};

@Injectable()
export class ApplicationService {
	private readonly applicationsListMaxLimit = 100;

	constructor(
		@InjectModel('Application') private readonly applicationModel: Model<Application>,
		@InjectModel('Kindergarten') private readonly kindergartenModel: Model<Kindergarten>,
		@InjectModel('KindergartenStaff') private readonly kindergartenStaffModel: Model<KindergartenStaff>,
		@InjectModel('Member') private readonly memberModel: Model<Member>,
		private readonly notificationService: NotificationService,
	) {}

	public async createApplication(authMember: Member, input: ApplicationInput): Promise<Application> {
		if (authMember.memberType !== MemberType.PARENT) throw new ForbiddenException(Message.ONLY_SPECIFIC_ROLES_ALLOWED);

		await this.validateActiveParent(authMember._id);
		const kindergarten = await this.validateActiveKindergarten(input.kindergartenId);
		await this.assertNoOpenDuplicateApplication(authMember._id, input.kindergartenId);
		const documents = this.validateApplicationDocuments(input.documents);

		try {
			const application = await this.applicationModel.create({
				...input,
				documents,
				parentId: authMember._id,
				kindergartenOwnerId: kindergarten.memberId,
				status: ApplicationStatus.PENDING,
			});

			void this.reserveApplicationCreatedHooks(application).catch((err) => {
				console.log('Application created notification hook failed:', err.message);
			});
			return application;
		} catch (err) {
			console.log('Error, Service.model:', err.message);
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}

	public async getMyApplications(authMember: Member, input: ApplicationsInquiry): Promise<Applications> {
		const match = this.shapeInquiryMatch(input);
		match.parentId = authMember._id;

		return await this.findApplications(match, input, { includeKindergartenData: true });
	}

	public async getKindergartenApplications(authMember: Member, input: ApplicationsInquiry): Promise<Applications> {
		const match = this.shapeInquiryMatch(input);

		if (match.kindergartenId) {
			await this.assertCanManageApplicationKindergarten(authMember, match.kindergartenId);
		} else {
			const kindergartenIds = await this.getManagedKindergartenIds(authMember._id);
			match.kindergartenId = { $in: kindergartenIds };
		}

		return await this.findApplications(match, input, { includeParentData: true, includeKindergartenData: true });
	}

	public async getAllApplicationsForAdmin(input: ApplicationsInquiry): Promise<Applications> {
		const match = this.shapeInquiryMatch(input);
		return await this.findApplications(match, input, { includeParentData: true, includeKindergartenData: true });
	}

	public async updateApplicationStatus(
		authMember: Member,
		input: ApplicationStatusUpdateInput,
	): Promise<Application> {
		const application = await this.applicationModel.findById(input._id).exec();
		if (!application) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		await this.assertCanManageApplicationKindergarten(authMember, application.kindergartenId);
		this.assertValidStatusTransition(application.status, input.status);

		const update: T = {
			status: input.status,
		};

		if (input.adminNote !== undefined) update.adminNote = input.adminNote;
		if (REVIEWED_APPLICATION_STATUSES.includes(input.status)) {
			update.reviewedBy = authMember._id;
			update.reviewedAt = new Date();
		}
		if (input.status === ApplicationStatus.CANCELED) {
			update.canceledAt = new Date();
		}

		const result = await this.applicationModel.findByIdAndUpdate(application._id, update, { new: true }).exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

		void this.reserveApplicationStatusUpdatedHooks(result).catch((err) => {
			console.log('Application status notification hook failed:', err.message);
		});
		return result;
	}

	public async cancelApplication(authMember: Member, applicationId: ObjectId): Promise<Application> {
		const application = await this.applicationModel.findById(applicationId).exec();
		if (!application) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		if (application.parentId.toString() !== authMember._id.toString()) {
			throw new ForbiddenException(Message.NOT_ALLOWED_REQUEST);
		}
		if (FINAL_APPLICATION_STATUSES.includes(application.status)) {
			throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);
		}

		const result = await this.applicationModel
			.findByIdAndUpdate(
				application._id,
				{
					status: ApplicationStatus.CANCELED,
					canceledAt: new Date(),
				},
				{ new: true },
			)
			.exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

		void this.reserveApplicationCanceledHooks(result).catch((err) => {
			console.log('Application canceled notification hook failed:', err.message);
		});
		return result;
	}

	private shapeInquiryMatch(input: ApplicationsInquiry): T {
		const match: T = {};
		const { parentId, kindergartenId, kindergartenOwnerId, status } = input.search ?? {};

		if (parentId) match.parentId = parentId;
		if (kindergartenId) match.kindergartenId = kindergartenId;
		if (kindergartenOwnerId) match.kindergartenOwnerId = kindergartenOwnerId;
		if (status) match.status = status;

		return match;
	}

	private validateApplicationDocuments(documents?: ApplicationDocumentInput[]): ApplicationDocumentInput[] {
		if (documents === undefined || documents === null) return [];
		if (!Array.isArray(documents)) throw new BadRequestException(Message.BAD_REQUEST);
		if (!documents.length) return [];
		if (documents.length > maxApplicationDocuments) throw new BadRequestException(Message.BAD_REQUEST);

		return documents.map((document) => {
			const url = document?.url?.trim();
			const name = document?.name?.trim();
			const mimeType = document?.mimeType?.trim();
			const size = Number(document?.size);

			const validDocument =
				url &&
				name &&
				mimeType &&
				Number.isFinite(size) &&
				size > 0 &&
				size <= maxApplicationDocumentSize &&
				url.startsWith('uploads/application/') &&
				validApplicationDocumentMimeTypes.includes(mimeType);

			if (!validDocument) throw new BadRequestException(Message.BAD_REQUEST);

			return {
				url,
				name,
				mimeType,
				size,
			};
		});
	}

	private async findApplications(
		match: T,
		input: ApplicationsInquiry,
		options: { includeParentData?: boolean; includeKindergartenData?: boolean } = {},
	): Promise<Applications> {
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };
		const limit = capPaginationLimit(input.limit, this.applicationsListMaxLimit);
		const listPipeline: PipelineStage.FacetPipelineStage[] = [
			{ $skip: (input.page - 1) * limit },
			{ $limit: limit },
		];

		if (options.includeParentData) listPipeline.push(...this.getParentDataLookupStages());
		if (options.includeKindergartenData) listPipeline.push(...this.getKindergartenDataLookupStages());

		const result = await this.applicationModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: listPipeline,
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();

		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return result[0];
	}

	private getParentDataLookupStages(): PipelineStage.FacetPipelineStage[] {
		return [
			{
				$lookup: {
					from: 'members',
					let: { localParentId: '$parentId' },
					pipeline: [
						{
							$match: {
								$expr: { $eq: ['$_id', '$$localParentId'] },
							},
						},
						{ $project: memberPreviewProjection },
					],
					as: 'parentData',
				},
			},
			{ $unwind: { path: '$parentData', preserveNullAndEmptyArrays: true } },
		];
	}

	private getKindergartenDataLookupStages(): PipelineStage.FacetPipelineStage[] {
		return [
			{
				$lookup: {
					from: 'kindergartens',
					let: { localKindergartenId: '$kindergartenId' },
					pipeline: [
						{
							$match: {
								$expr: { $eq: ['$_id', '$$localKindergartenId'] },
							},
						},
						{
							$project: {
								_id: 1,
								kindergartenType: 1,
								kindergartenStatus: 1,
								kindergartenLocation: 1,
								kindergartenAddress: 1,
								kindergartenTitle: 1,
								kindergartenPrice: 1,
								kindergartenCapacity: 1,
								kindergartenAgeRange: 1,
								kindergartenPrograms: 1,
								kindergartenViews: 1,
								kindergartenLikes: 1,
								kindergartenComments: 1,
								kindergartenRank: 1,
								kindergartenImages: 1,
								kindergartenDesc: 1,
								memberId: 1,
								deletedAt: 1,
								establishedAt: 1,
								createdAt: 1,
								updatedAt: 1,
							},
						},
					],
					as: 'kindergartenData',
				},
			},
			{ $unwind: { path: '$kindergartenData', preserveNullAndEmptyArrays: true } },
		];
	}

	private async validateActiveParent(parentId: ObjectId): Promise<void> {
		const parent = await this.memberModel
			.findOne({ _id: parentId, memberType: MemberType.PARENT, memberStatus: MemberStatus.ACTIVE })
			.exec();
		if (!parent) throw new ForbiddenException(Message.NOT_ALLOWED_REQUEST);
	}

	private async validateActiveKindergarten(kindergartenId: ObjectId): Promise<Kindergarten> {
		const kindergarten = await this.kindergartenModel
			.findOne({ _id: kindergartenId, kindergartenStatus: KindergartenStatus.ACTIVE })
			.exec();
		if (!kindergarten) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return kindergarten;
	}

	private async assertNoOpenDuplicateApplication(parentId: ObjectId, kindergartenId: ObjectId): Promise<void> {
		const duplicate = await this.applicationModel
			.findOne({
				parentId,
				kindergartenId,
				status: { $in: OPEN_APPLICATION_STATUSES },
			})
			.exec();
		if (duplicate) throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);
	}

	private async assertCanManageApplicationKindergarten(authMember: Member, kindergartenId: ObjectId): Promise<void> {
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

	private async getActiveKindergartenAdminRecipientIds(
		kindergartenId: ObjectId,
		excludedIds: ObjectId[] = [],
	): Promise<ObjectId[]> {
		const excluded = new Set(excludedIds.map((id) => id.toString()));
		const staffRecords = await this.kindergartenStaffModel
			.find({
				kindergartenId,
				staffStatus: StaffStatus.ACTIVE,
				staffRole: { $in: [StaffRole.OWNER, StaffRole.ADMIN] },
			})
			.select('memberId')
			.exec();

		return this.uniqueObjectIds(staffRecords.map((staff) => staff.memberId)).filter(
			(memberId) => !excluded.has(memberId.toString()),
		);
	}

	private uniqueObjectIds(ids: ObjectId[]): ObjectId[] {
		const seen = new Set<string>();
		return ids.filter((id) => {
			const key = id.toString();
			if (seen.has(key)) return false;
			seen.add(key);
			return true;
		});
	}

	private async createNotificationsBestEffort(inputs: NotificationInput[]): Promise<void> {
		for (const input of inputs) {
			try {
				await this.notificationService.createNotification(input);
			} catch (err) {
				console.log('Application notification failed:', err.message);
			}
		}
	}

	private assertValidStatusTransition(currentStatus: ApplicationStatus, nextStatus: ApplicationStatus): void {
		const allowedNextStatuses = APPLICATION_STATUS_TRANSITIONS[currentStatus] ?? [];
		if (!allowedNextStatuses.includes(nextStatus)) throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);
	}

	private async reserveApplicationCreatedHooks(application: Application): Promise<void> {
		const recipientIds = await this.getActiveKindergartenAdminRecipientIds(application.kindergartenId, [
			application.parentId,
		]);
		await this.createNotificationsBestEffort(
			recipientIds.map((recipientId) => ({
				recipientId,
				senderId: application.parentId,
				type: NotificationType.KINDERGARTEN_APPLICATION_CREATED,
				title: 'New kindergarten application',
				message: 'A parent submitted a new kindergarten application.',
				targetType: NotificationTargetType.APPLICATION,
				targetId: application._id,
				metadata: {
					kindergartenId: application.kindergartenId.toString(),
					status: application.status,
				},
			})),
		);
	}

	private async reserveApplicationStatusUpdatedHooks(application: Application): Promise<void> {
		await this.createNotificationsBestEffort([
			{
				recipientId: application.parentId,
				senderId: application.reviewedBy,
				type: NotificationType.KINDERGARTEN_APPLICATION_STATUS_UPDATED,
				title: 'Kindergarten application updated',
				message: `Your kindergarten application status is ${application.status}.`,
				targetType: NotificationTargetType.APPLICATION,
				targetId: application._id,
				metadata: {
					kindergartenId: application.kindergartenId.toString(),
					status: application.status,
				},
			},
		]);
	}

	private async reserveApplicationCanceledHooks(application: Application): Promise<void> {
		const recipientIds = await this.getActiveKindergartenAdminRecipientIds(application.kindergartenId, [
			application.parentId,
		]);
		await this.createNotificationsBestEffort(
			recipientIds.map((recipientId) => ({
				recipientId,
				senderId: application.parentId,
				type: NotificationType.KINDERGARTEN_APPLICATION_CANCELED,
				title: 'Kindergarten application canceled',
				message: 'A parent canceled a kindergarten application.',
				targetType: NotificationTargetType.APPLICATION,
				targetId: application._id,
				metadata: {
					kindergartenId: application.kindergartenId.toString(),
					status: application.status,
				},
			})),
		);
	}
}
