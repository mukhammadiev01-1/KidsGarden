import { BadRequestException, ForbiddenException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { ClientSession, Connection, Model, ObjectId, PipelineStage } from 'mongoose';
import { Direction, Message } from '../../libs/enums/common.enum';
import { capPaginationLimit, memberPreviewProjection } from '../../libs/config';
import { KindergartenStatus } from '../../libs/enums/kindergarten.enum';
import { StaffRole, StaffStatus } from '../../libs/enums/kindergarten-staff.enum';
import { MemberStatus, MemberType } from '../../libs/enums/member.enum';
import { StaffApplicationStatus } from '../../libs/enums/staff-application.enum';
import { NotificationTargetType, NotificationType } from '../../libs/enums/notification.enum';
import { T } from '../../libs/types/common';
import { Kindergarten } from '../../libs/dto/kindergarten/kindergarten';
import { KindergartenStaff } from '../../libs/dto/kindergarten-staff/kindergarten-staff';
import { Member } from '../../libs/dto/member/member';
import { NotificationInput } from '../../libs/dto/notification/notification.input';
import { StaffApplication, StaffApplications } from '../../libs/dto/staff-application/staff-application';
import {
	StaffApplicationInput,
	StaffApplicationReviewInput,
	StaffApplicationsInquiry,
} from '../../libs/dto/staff-application/staff-application.input';
import { NotificationService } from '../notification/notification.service';

const STAFF_APPLICATION_STATUS_TRANSITIONS: Record<StaffApplicationStatus, StaffApplicationStatus[]> = {
	[StaffApplicationStatus.PENDING]: [
		StaffApplicationStatus.APPROVED,
		StaffApplicationStatus.REJECTED,
		StaffApplicationStatus.CANCELED,
	],
	[StaffApplicationStatus.APPROVED]: [],
	[StaffApplicationStatus.REJECTED]: [],
	[StaffApplicationStatus.CANCELED]: [],
};

@Injectable()
export class StaffApplicationService {
	private readonly staffApplicationsListMaxLimit = 100;

	constructor(
		@InjectModel('StaffApplication') private readonly staffApplicationModel: Model<StaffApplication>,
		@InjectModel('Kindergarten') private readonly kindergartenModel: Model<Kindergarten>,
		@InjectModel('KindergartenStaff') private readonly kindergartenStaffModel: Model<KindergartenStaff>,
		@InjectModel('Member') private readonly memberModel: Model<Member>,
		private readonly notificationService: NotificationService,
		@InjectConnection() private readonly connection: Connection,
	) {}

	public async createStaffApplication(authMember: Member, input: StaffApplicationInput): Promise<StaffApplication> {
		if (authMember.memberType !== MemberType.PARENT) throw new ForbiddenException(Message.ONLY_SPECIFIC_ROLES_ALLOWED);
		if (input.requestedRole !== StaffRole.TEACHER) throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);

		await this.validateKindergarten(input.kindergartenId);

		const duplicate = await this.staffApplicationModel
			.findOne({
				kindergartenId: input.kindergartenId,
				applicantId: authMember._id,
				applicationStatus: StaffApplicationStatus.PENDING,
			})
			.exec();
		if (duplicate) throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);

		try {
			const application = await this.staffApplicationModel.create({
				...input,
				applicantId: authMember._id,
				applicationStatus: StaffApplicationStatus.PENDING,
			});
			void this.reserveStaffApplicationCreatedHooks(application).catch((err) => {
				console.log('Staff application created notification hook failed:', err.message);
			});

			return application;
		} catch (err) {
			console.log('Error, Service.model:', err.message);
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}

	public async getMyStaffApplications(authMember: Member, input: StaffApplicationsInquiry): Promise<StaffApplications> {
		const match = this.shapeInquiryMatch(input);
		match.applicantId = authMember._id;

		return await this.findApplications(match, input);
	}

	public async getStaffApplications(authMember: Member, input: StaffApplicationsInquiry): Promise<StaffApplications> {
		const match = this.shapeInquiryMatch(input);

		if (authMember.memberType === MemberType.KINDERGARTEN_ADMIN) {
			if (match.kindergartenId) {
				await this.assertCanManageStaff(authMember, match.kindergartenId);
			} else {
				const kindergartenIds = await this.getManagedKindergartenIds(authMember._id);
				match.kindergartenId = { $in: kindergartenIds };
			}
		}

		return await this.findApplications(match, input, true);
	}

	public async cancelStaffApplication(authMember: Member, applicationId: ObjectId): Promise<StaffApplication> {
		const application = await this.staffApplicationModel.findById(applicationId).exec();
		if (!application) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		if (application.applicantId.toString() !== authMember._id.toString()) {
			throw new ForbiddenException(Message.NOT_ALLOWED_REQUEST);
		}
		this.assertValidStatusTransition(application.applicationStatus, StaffApplicationStatus.CANCELED);

		const result = await this.staffApplicationModel
			.findByIdAndUpdate(applicationId, { applicationStatus: StaffApplicationStatus.CANCELED }, { new: true })
			.exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

		return result;
	}

	public async approveStaffApplication(
		authMember: Member,
		input: StaffApplicationReviewInput,
	): Promise<StaffApplication> {
		const session = await this.connection.startSession();

		try {
			const result = await session.withTransaction(async () => {
				const application = await this.validateReviewApplication(input._id, StaffApplicationStatus.APPROVED, session);
				await this.assertCanManageStaff(authMember, application.kindergartenId, session);
				const applicant = await this.memberModel
					.findOne({
						_id: application.applicantId,
						memberStatus: MemberStatus.ACTIVE,
					})
					.session(session)
					.exec();
				if (!applicant) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

				if (![MemberType.PARENT, MemberType.TEACHER].includes(applicant.memberType)) {
					throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);
				}

				const existingStaff = await this.kindergartenStaffModel
					.findOne({ kindergartenId: application.kindergartenId, memberId: application.applicantId })
					.session(session)
					.exec();

				if (existingStaff && existingStaff.staffStatus !== StaffStatus.REMOVED) {
					throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);
				}

				if (applicant.memberType === MemberType.PARENT) {
					const updatedApplicant = await this.memberModel
						.findByIdAndUpdate(applicant._id, { memberType: MemberType.TEACHER }, { new: true, session })
						.exec();
					if (!updatedApplicant) throw new InternalServerErrorException(Message.UPDATE_FAILED);
				}

				if (!existingStaff) {
					await this.kindergartenStaffModel.create(
						[
							{
								kindergartenId: application.kindergartenId,
								memberId: application.applicantId,
								staffRole: StaffRole.TEACHER,
								staffStatus: StaffStatus.ACTIVE,
							},
						],
						{ session },
					);
				} else if (existingStaff.staffStatus === StaffStatus.REMOVED) {
					const reactivatedStaff = await this.kindergartenStaffModel
						.findByIdAndUpdate(
							existingStaff._id,
							{ staffRole: StaffRole.TEACHER, staffStatus: StaffStatus.ACTIVE },
							{ new: true, session },
						)
						.exec();
					if (!reactivatedStaff) throw new InternalServerErrorException(Message.UPDATE_FAILED);
				}

				const approvedApplication = await this.staffApplicationModel
					.findByIdAndUpdate(
						application._id,
						{
							applicationStatus: StaffApplicationStatus.APPROVED,
							reviewedBy: authMember._id,
							reviewedAt: new Date(),
						},
						{ new: true, session },
					)
					.exec();
				if (!approvedApplication) throw new InternalServerErrorException(Message.UPDATE_FAILED);

				return approvedApplication;
			});

			if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);
			void this.reserveStaffApplicationStatusUpdatedHooks(result).catch((err) => {
				console.log('Staff application approved notification hook failed:', err.message);
			});
			return result;
		} finally {
			await session.endSession();
		}
	}

	public async rejectStaffApplication(authMember: Member, input: StaffApplicationReviewInput): Promise<StaffApplication> {
		const application = await this.validateReviewApplication(input._id, StaffApplicationStatus.REJECTED);
		await this.assertCanManageStaff(authMember, application.kindergartenId);

		const result = await this.staffApplicationModel
			.findByIdAndUpdate(
				application._id,
				{
					applicationStatus: StaffApplicationStatus.REJECTED,
					reviewedBy: authMember._id,
					reviewedAt: new Date(),
					rejectReason: input.rejectReason,
				},
				{ new: true },
			)
			.exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

		void this.reserveStaffApplicationStatusUpdatedHooks(result).catch((err) => {
			console.log('Staff application rejected notification hook failed:', err.message);
		});

		return result;
	}

	private shapeInquiryMatch(input: StaffApplicationsInquiry): T {
		const match: T = {};
		const { kindergartenId, applicantId, requestedRole, applicationStatus } = input.search;

		if (kindergartenId) match.kindergartenId = kindergartenId;
		if (applicantId) match.applicantId = applicantId;
		if (requestedRole) match.requestedRole = requestedRole;
		if (applicationStatus) match.applicationStatus = applicationStatus;

		return match;
	}

	private async findApplications(
		match: T,
		input: StaffApplicationsInquiry,
		includeApplicantData = false,
	): Promise<StaffApplications> {
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };
		const limit = capPaginationLimit(input.limit, this.staffApplicationsListMaxLimit);
		const listPipeline: PipelineStage.FacetPipelineStage[] = [
			{ $skip: (input.page - 1) * limit },
			{ $limit: limit },
		];

		if (includeApplicantData) {
			listPipeline.push(...this.getApplicantDataLookupStages());
		}

		const result = await this.staffApplicationModel
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

	private getApplicantDataLookupStages(): PipelineStage.FacetPipelineStage[] {
		return [
			{
				$lookup: {
					from: 'members',
					let: { localApplicantId: '$applicantId' },
					pipeline: [
						{
							$match: {
								$expr: { $eq: ['$_id', '$$localApplicantId'] },
							},
						},
						{ $project: memberPreviewProjection },
					],
					as: 'applicantData',
				},
			},
			{ $unwind: { path: '$applicantData', preserveNullAndEmptyArrays: true } },
		];
	}

	private async validateReviewApplication(
		applicationId: ObjectId,
		nextStatus: StaffApplicationStatus,
		session?: ClientSession,
	): Promise<StaffApplication> {
		const query = this.staffApplicationModel.findById(applicationId);
		if (session) query.session(session);
		const application = await query.exec();
		if (!application) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		this.assertValidStatusTransition(application.applicationStatus, nextStatus);

		return application;
	}

	private assertValidStatusTransition(
		currentStatus: StaffApplicationStatus,
		nextStatus: StaffApplicationStatus,
	): void {
		const allowedStatuses = STAFF_APPLICATION_STATUS_TRANSITIONS[currentStatus] ?? [];
		if (!allowedStatuses.includes(nextStatus)) throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);
	}

	private async assertCanManageStaff(authMember: Member, kindergartenId: ObjectId, session?: ClientSession): Promise<void> {
		if (authMember.memberType === MemberType.SUPER_ADMIN) return;

		if (authMember.memberType !== MemberType.KINDERGARTEN_ADMIN) {
			throw new ForbiddenException(Message.ONLY_SPECIFIC_ROLES_ALLOWED);
		}

		const query = this.kindergartenStaffModel.findOne({
			kindergartenId,
			memberId: authMember._id,
			staffStatus: StaffStatus.ACTIVE,
			staffRole: { $in: [StaffRole.OWNER, StaffRole.ADMIN] },
		});
		if (session) query.session(session);
		const ownerRecord = await query.exec();

		if (!ownerRecord) throw new ForbiddenException(Message.NOT_ALLOWED_REQUEST);
	}

	private async validateKindergarten(kindergartenId: ObjectId): Promise<void> {
		const target = await this.kindergartenModel
			.findOne({ _id: kindergartenId, kindergartenStatus: KindergartenStatus.ACTIVE })
			.exec();
		if (!target) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
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
				console.log('Staff application notification failed:', err.message);
			}
		}
	}

	private async reserveStaffApplicationCreatedHooks(application: StaffApplication): Promise<void> {
		const recipientIds = await this.getActiveKindergartenAdminRecipientIds(application.kindergartenId, [
			application.applicantId,
		]);
		await this.createNotificationsBestEffort(
			recipientIds.map((recipientId) => ({
				recipientId,
				senderId: application.applicantId,
				type: NotificationType.TEACHER_APPLICATION_CREATED,
				title: 'New teacher application',
				message: 'A teacher application was submitted for your kindergarten.',
				targetType: NotificationTargetType.STAFF_APPLICATION,
				targetId: application._id,
				metadata: {
					kindergartenId: application.kindergartenId.toString(),
					status: application.applicationStatus,
				},
			})),
		);
	}

	private async reserveStaffApplicationStatusUpdatedHooks(application: StaffApplication): Promise<void> {
		await this.createNotificationsBestEffort([
			{
				recipientId: application.applicantId,
				senderId: application.reviewedBy,
				type: NotificationType.TEACHER_APPLICATION_STATUS_UPDATED,
				title: 'Teacher application updated',
				message: `Your teacher application status is ${application.applicationStatus}.`,
				targetType: NotificationTargetType.STAFF_APPLICATION,
				targetId: application._id,
				metadata: {
					kindergartenId: application.kindergartenId.toString(),
					status: application.applicationStatus,
				},
			},
		]);
	}
}
