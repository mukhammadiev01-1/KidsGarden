import { BadRequestException, ForbiddenException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { ClientSession, Connection, Model, ObjectId, PipelineStage } from 'mongoose';
import { capPaginationLimit, memberPreviewProjection } from '../../libs/config';
import { Direction, Message } from '../../libs/enums/common.enum';
import { KindergartenAdminApplicationStatus } from '../../libs/enums/kindergarten-admin-application.enum';
import { MemberStatus, MemberType } from '../../libs/enums/member.enum';
import { NotificationTargetType, NotificationType } from '../../libs/enums/notification.enum';
import { T } from '../../libs/types/common';
import { Member } from '../../libs/dto/member/member';
import { NotificationInput } from '../../libs/dto/notification/notification.input';
import {
	KindergartenAdminApplication,
	KindergartenAdminApplications,
} from '../../libs/dto/kindergarten-admin-application/kindergarten-admin-application';
import {
	KindergartenAdminApplicationInput,
	KindergartenAdminApplicationReviewInput,
	KindergartenAdminApplicationsInquiry,
} from '../../libs/dto/kindergarten-admin-application/kindergarten-admin-application.input';
import { NotificationService } from '../notification/notification.service';

const KINDERGARTEN_ADMIN_APPLICATION_STATUS_TRANSITIONS: Record<
	KindergartenAdminApplicationStatus,
	KindergartenAdminApplicationStatus[]
> = {
	[KindergartenAdminApplicationStatus.PENDING]: [
		KindergartenAdminApplicationStatus.APPROVED,
		KindergartenAdminApplicationStatus.REJECTED,
		KindergartenAdminApplicationStatus.CANCELED,
	],
	[KindergartenAdminApplicationStatus.APPROVED]: [],
	[KindergartenAdminApplicationStatus.REJECTED]: [],
	[KindergartenAdminApplicationStatus.CANCELED]: [],
};

@Injectable()
export class KindergartenAdminApplicationService {
	private readonly kindergartenAdminApplicationsListMaxLimit = 100;

	constructor(
		@InjectModel('KindergartenAdminApplication')
		private readonly kindergartenAdminApplicationModel: Model<KindergartenAdminApplication>,
		@InjectModel('Member') private readonly memberModel: Model<Member>,
		private readonly notificationService: NotificationService,
		@InjectConnection() private readonly connection: Connection,
	) {}

	public async createKindergartenAdminApplication(
		authMember: Member,
		input: KindergartenAdminApplicationInput,
	): Promise<KindergartenAdminApplication> {
		if (authMember.memberType !== MemberType.PARENT) throw new ForbiddenException(Message.ONLY_SPECIFIC_ROLES_ALLOWED);

		await this.validateActiveParent(authMember._id);

		const duplicate = await this.kindergartenAdminApplicationModel
			.findOne({
				applicantId: authMember._id,
				applicationStatus: KindergartenAdminApplicationStatus.PENDING,
			})
			.exec();
		if (duplicate) throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);

		try {
			const application = await this.kindergartenAdminApplicationModel.create({
				...input,
				applicantId: authMember._id,
				applicationStatus: KindergartenAdminApplicationStatus.PENDING,
			});
			void this.reserveKindergartenAdminApplicationCreatedHooks(application).catch((err) => {
				console.log('Kindergarten admin application created notification hook failed:', err.message);
			});

			return application;
		} catch (err) {
			console.log('Error, Service.model:', err.message);
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}

	public async getMyKindergartenAdminApplications(
		authMember: Member,
		input: KindergartenAdminApplicationsInquiry,
	): Promise<KindergartenAdminApplications> {
		const match = this.shapeInquiryMatch(input);
		match.applicantId = authMember._id;

		return await this.findApplications(match, input);
	}

	public async getKindergartenAdminApplications(
		input: KindergartenAdminApplicationsInquiry,
	): Promise<KindergartenAdminApplications> {
		const match = this.shapeInquiryMatch(input);

		return await this.findApplications(match, input, true);
	}

	public async cancelKindergartenAdminApplication(
		authMember: Member,
		applicationId: ObjectId,
	): Promise<KindergartenAdminApplication> {
		const application = await this.kindergartenAdminApplicationModel.findById(applicationId).exec();
		if (!application) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		if (application.applicantId.toString() !== authMember._id.toString()) {
			throw new ForbiddenException(Message.NOT_ALLOWED_REQUEST);
		}
		this.assertValidStatusTransition(application.applicationStatus, KindergartenAdminApplicationStatus.CANCELED);

		const result = await this.kindergartenAdminApplicationModel
			.findByIdAndUpdate(
				applicationId,
				{ applicationStatus: KindergartenAdminApplicationStatus.CANCELED },
				{ new: true },
			)
			.exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

		return result;
	}

	public async approveKindergartenAdminApplication(
		authMember: Member,
		input: KindergartenAdminApplicationReviewInput,
	): Promise<KindergartenAdminApplication> {
		const session = await this.connection.startSession();

		try {
			const result = await session.withTransaction(async () => {
				this.assertSuperAdminReviewer(authMember);
				const application = await this.validateReviewApplication(
					input._id,
					KindergartenAdminApplicationStatus.APPROVED,
					session,
				);
				const applicant = await this.memberModel
					.findOne({
						_id: application.applicantId,
						memberStatus: MemberStatus.ACTIVE,
					})
					.session(session)
					.exec();
				if (!applicant) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

				if (applicant.memberType !== MemberType.PARENT) {
					throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);
				}

				const updatedApplicant = await this.memberModel
					.findByIdAndUpdate(applicant._id, { memberType: MemberType.KINDERGARTEN_ADMIN }, { new: true, session })
					.exec();
				if (!updatedApplicant) throw new InternalServerErrorException(Message.UPDATE_FAILED);

				const approvedApplication = await this.kindergartenAdminApplicationModel
					.findByIdAndUpdate(
						application._id,
						{
							applicationStatus: KindergartenAdminApplicationStatus.APPROVED,
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
			void this.reserveKindergartenAdminApplicationStatusUpdatedHooks(result).catch((err) => {
				console.log('Kindergarten admin application approved notification hook failed:', err.message);
			});
			return result;
		} finally {
			await session.endSession();
		}
	}

	public async rejectKindergartenAdminApplication(
		authMember: Member,
		input: KindergartenAdminApplicationReviewInput,
	): Promise<KindergartenAdminApplication> {
		this.assertSuperAdminReviewer(authMember);
		const application = await this.validateReviewApplication(input._id, KindergartenAdminApplicationStatus.REJECTED);

		const result = await this.kindergartenAdminApplicationModel
			.findByIdAndUpdate(
				application._id,
				{
					applicationStatus: KindergartenAdminApplicationStatus.REJECTED,
					reviewedBy: authMember._id,
					reviewedAt: new Date(),
					rejectReason: input.rejectReason,
				},
				{ new: true },
			)
			.exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

		void this.reserveKindergartenAdminApplicationStatusUpdatedHooks(result).catch((err) => {
			console.log('Kindergarten admin application rejected notification hook failed:', err.message);
		});

		return result;
	}

	private shapeInquiryMatch(input: KindergartenAdminApplicationsInquiry): T {
		const match: T = {};
		const { applicantId, applicationStatus } = input.search ?? {};

		if (applicantId) match.applicantId = applicantId;
		if (applicationStatus) match.applicationStatus = applicationStatus;

		return match;
	}

	private async findApplications(
		match: T,
		input: KindergartenAdminApplicationsInquiry,
		includeApplicantData = false,
	): Promise<KindergartenAdminApplications> {
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };
		const limit = capPaginationLimit(input.limit, this.kindergartenAdminApplicationsListMaxLimit);
		const listPipeline: PipelineStage.FacetPipelineStage[] = [
			{ $skip: (input.page - 1) * limit },
			{ $limit: limit },
		];

		if (includeApplicantData) {
			listPipeline.push(...this.getApplicantDataLookupStages());
		}

		const result = await this.kindergartenAdminApplicationModel
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
		nextStatus: KindergartenAdminApplicationStatus,
		session?: ClientSession,
	): Promise<KindergartenAdminApplication> {
		const query = this.kindergartenAdminApplicationModel.findById(applicationId);
		if (session) query.session(session);
		const application = await query.exec();
		if (!application) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		this.assertValidStatusTransition(application.applicationStatus, nextStatus);

		return application;
	}

	private assertValidStatusTransition(
		currentStatus: KindergartenAdminApplicationStatus,
		nextStatus: KindergartenAdminApplicationStatus,
	): void {
		const allowedStatuses = KINDERGARTEN_ADMIN_APPLICATION_STATUS_TRANSITIONS[currentStatus] ?? [];
		if (!allowedStatuses.includes(nextStatus)) throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);
	}

	private assertSuperAdminReviewer(authMember: Member): void {
		if (authMember.memberType !== MemberType.SUPER_ADMIN) {
			throw new ForbiddenException(Message.ONLY_SPECIFIC_ROLES_ALLOWED);
		}
	}

	private async validateActiveParent(memberId: ObjectId): Promise<void> {
		const applicant = await this.memberModel
			.findOne({
				_id: memberId,
				memberType: MemberType.PARENT,
				memberStatus: MemberStatus.ACTIVE,
			})
			.exec();
		if (!applicant) throw new ForbiddenException(Message.NOT_ALLOWED_REQUEST);
	}

	private async getActiveSuperAdminRecipientIds(excludedIds: ObjectId[] = []): Promise<ObjectId[]> {
		const excluded = new Set(excludedIds.map((id) => id.toString()));
		const superAdmins = await this.memberModel
			.find({ memberType: MemberType.SUPER_ADMIN, memberStatus: MemberStatus.ACTIVE })
			.select('_id')
			.exec();

		return this.uniqueObjectIds(superAdmins.map((member) => member._id)).filter(
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
				console.log('Kindergarten admin application notification failed:', err.message);
			}
		}
	}

	private async reserveKindergartenAdminApplicationCreatedHooks(
		application: KindergartenAdminApplication,
	): Promise<void> {
		const recipientIds = await this.getActiveSuperAdminRecipientIds([application.applicantId]);
		await this.createNotificationsBestEffort(
			recipientIds.map((recipientId) => ({
				recipientId,
				senderId: application.applicantId,
				type: NotificationType.KINDERGARTEN_ADMIN_APPLICATION_CREATED,
				title: 'New kindergarten admin application',
				message: 'A kindergarten admin application was submitted.',
				targetType: NotificationTargetType.KINDERGARTEN_ADMIN_APPLICATION,
				targetId: application._id,
				metadata: {
					status: application.applicationStatus,
				},
			})),
		);
	}

	private async reserveKindergartenAdminApplicationStatusUpdatedHooks(
		application: KindergartenAdminApplication,
	): Promise<void> {
		await this.createNotificationsBestEffort([
			{
				recipientId: application.applicantId,
				senderId: application.reviewedBy,
				type: NotificationType.KINDERGARTEN_ADMIN_APPLICATION_STATUS_UPDATED,
				title: 'Kindergarten admin application updated',
				message: `Your kindergarten admin application status is ${application.applicationStatus}.`,
				targetType: NotificationTargetType.KINDERGARTEN_ADMIN_APPLICATION,
				targetId: application._id,
				metadata: {
					status: application.applicationStatus,
				},
			},
		]);
	}
}
