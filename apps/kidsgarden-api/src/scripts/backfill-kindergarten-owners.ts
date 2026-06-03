import 'dotenv/config';
import mongoose from 'mongoose';
import KindergartenSchema from '../shemas/Kindergarten.model';
import KindergartenStaffSchema from '../shemas/KindergartenStaff.model';
import MemberSchema from '../shemas/Member.model';
import { KindergartenStatus } from '../libs/enums/kindergarten.enum';
import { StaffRole, StaffStatus } from '../libs/enums/kindergarten-staff.enum';
import { MemberStatus, MemberType } from '../libs/enums/member.enum';

type SkippedRecord = {
	kindergartenId: string;
	kindergartenTitle?: string;
	memberId?: string;
	reason: string;
};

type Summary = {
	scannedKindergartens: number;
	missingOwnerCount: number;
	wouldCreateCount: number;
	wouldReactivateCount: number;
	skippedCount: number;
	appliedCreateCount: number;
	appliedReactivateCount: number;
	skippedRecords: SkippedRecord[];
};

const KindergartenModel = mongoose.model('Kindergarten', KindergartenSchema);
const KindergartenStaffModel = mongoose.model('KindergartenStaff', KindergartenStaffSchema);
const MemberModel = mongoose.model('Member', MemberSchema);

function getMongoUri(): string {
	const uri = process.env.NODE_ENV === 'production' ? process.env.MONGO_PROD : process.env.MONGO_DEV;
	if (!uri) throw new Error('MongoDB URI is missing. Expected MONGO_PROD in production or MONGO_DEV otherwise.');

	return uri;
}

async function getKindergartensWithoutActiveOwner() {
	return await KindergartenModel.aggregate([
		{ $match: { kindergartenStatus: { $ne: KindergartenStatus.DELETE } } },
		{
			$lookup: {
				from: 'kindergartenStaffs',
				let: { kindergartenId: '$_id' },
				pipeline: [
					{
						$match: {
							$expr: { $eq: ['$kindergartenId', '$$kindergartenId'] },
							staffRole: StaffRole.OWNER,
							staffStatus: StaffStatus.ACTIVE,
						},
					},
				],
				as: 'activeOwnerStaff',
			},
		},
		{ $match: { activeOwnerStaff: { $size: 0 } } },
		{ $project: { _id: 1, kindergartenTitle: 1, memberId: 1, kindergartenStatus: 1 } },
	]).exec();
}

function pushSkipped(summary: Summary, record: SkippedRecord): void {
	summary.skippedRecords.push(record);
	summary.skippedCount += 1;
}

async function backfillKindergartenOwners(applyChanges: boolean): Promise<Summary> {
	const summary: Summary = {
		scannedKindergartens: 0,
		missingOwnerCount: 0,
		wouldCreateCount: 0,
		wouldReactivateCount: 0,
		skippedCount: 0,
		appliedCreateCount: 0,
		appliedReactivateCount: 0,
		skippedRecords: [],
	};

	summary.scannedKindergartens = await KindergartenModel.countDocuments({
		kindergartenStatus: { $ne: KindergartenStatus.DELETE },
	}).exec();

	const kindergartens = await getKindergartensWithoutActiveOwner();
	summary.missingOwnerCount = kindergartens.length;

	for (const kindergarten of kindergartens) {
		const kindergartenId = kindergarten._id?.toString();
		const kindergartenTitle = kindergarten.kindergartenTitle;
		const memberId = kindergarten.memberId?.toString();

		if (!kindergarten.memberId) {
			pushSkipped(summary, {
				kindergartenId,
				kindergartenTitle,
				reason: 'kindergarten.memberId is missing',
			});
			continue;
		}

		const member = await MemberModel.findById(kindergarten.memberId).lean().exec();
		if (!member) {
			pushSkipped(summary, {
				kindergartenId,
				kindergartenTitle,
				memberId,
				reason: 'creator member does not exist',
			});
			continue;
		}

		if (member.memberStatus !== MemberStatus.ACTIVE) {
			pushSkipped(summary, {
				kindergartenId,
				kindergartenTitle,
				memberId,
				reason: `creator memberStatus is ${member.memberStatus}`,
			});
			continue;
		}

		if (member.memberType !== MemberType.KINDERGARTEN_ADMIN) {
			pushSkipped(summary, {
				kindergartenId,
				kindergartenTitle,
				memberId,
				reason: `creator memberType is ${member.memberType}`,
			});
			continue;
		}

		const existingCreatorStaff = await KindergartenStaffModel.findOne({
			kindergartenId: kindergarten._id,
			memberId: kindergarten.memberId,
		})
			.lean()
			.exec();

		if (!existingCreatorStaff) {
			summary.wouldCreateCount += 1;
			if (applyChanges) {
				await KindergartenStaffModel.create({
					kindergartenId: kindergarten._id,
					memberId: kindergarten.memberId,
					staffRole: StaffRole.OWNER,
					staffStatus: StaffStatus.ACTIVE,
				});
				summary.appliedCreateCount += 1;
			}
			continue;
		}

		if (existingCreatorStaff.staffStatus === StaffStatus.REMOVED) {
			summary.wouldReactivateCount += 1;
			if (applyChanges) {
				await KindergartenStaffModel.findByIdAndUpdate(existingCreatorStaff._id, {
					staffRole: StaffRole.OWNER,
					staffStatus: StaffStatus.ACTIVE,
				}).exec();
				summary.appliedReactivateCount += 1;
			}
			continue;
		}

		pushSkipped(summary, {
			kindergartenId,
			kindergartenTitle,
			memberId,
			reason: `creator already has non-REMOVED staff record (${existingCreatorStaff.staffRole}/${existingCreatorStaff.staffStatus})`,
		});
	}

	return summary;
}

function printSummary(summary: Summary, applyChanges: boolean): void {
	console.log(`Mode: ${applyChanges ? 'APPLY' : 'DRY RUN'}`);
	console.log(`Scanned kindergartens: ${summary.scannedKindergartens}`);
	console.log(`Missing ACTIVE OWNER count: ${summary.missingOwnerCount}`);
	console.log(`Would create OWNER records: ${summary.wouldCreateCount}`);
	console.log(`Would reactivate OWNER records: ${summary.wouldReactivateCount}`);
	console.log(`Skipped records: ${summary.skippedCount}`);
	console.log(`Applied created records: ${summary.appliedCreateCount}`);
	console.log(`Applied reactivated records: ${summary.appliedReactivateCount}`);

	if (!summary.skippedRecords.length) return;

	console.log('\nSkipped details:');
	for (const skipped of summary.skippedRecords) {
		console.log(
			[
				`- kindergartenId=${skipped.kindergartenId}`,
				skipped.kindergartenTitle ? `title="${skipped.kindergartenTitle}"` : undefined,
				skipped.memberId ? `memberId=${skipped.memberId}` : undefined,
				`reason="${skipped.reason}"`,
			]
				.filter(Boolean)
				.join(' '),
		);
	}
}

async function main(): Promise<void> {
	const applyChanges = process.argv.includes('--apply');

	await mongoose.connect(getMongoUri());
	console.log(`Connected to ${process.env.NODE_ENV === 'production' ? 'production' : 'development'} database.`);

	const summary = await backfillKindergartenOwners(applyChanges);
	printSummary(summary, applyChanges);

	if (!applyChanges) {
		console.log('\nDry run only. Re-run with --apply to write changes.');
	}
}

main()
	.catch((err) => {
		console.error('Backfill failed:', err);
		process.exitCode = 1;
	})
	.finally(async () => {
		await mongoose.disconnect();
	});
