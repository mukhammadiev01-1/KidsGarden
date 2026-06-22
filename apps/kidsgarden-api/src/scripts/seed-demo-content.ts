import 'dotenv/config';
import mongoose from 'mongoose';
import * as bcrypt from 'bcryptjs';
import BoardArticleSchema from '../shemas/BoardArticle.model';
import KindergartenSchema from '../shemas/Kindergarten.model';
import KindergartenStaffSchema from '../shemas/KindergartenStaff.model';
import MemberSchema from '../shemas/Member.model';
import { BoardArticleCategory, BoardArticleStatus } from '../libs/enums/board-article.enum';
import { KindergartenLocation, KindergartenStatus, KindergartenType } from '../libs/enums/kindergarten.enum';
import { StaffRole, StaffStatus } from '../libs/enums/kindergarten-staff.enum';
import { MemberAuthType, MemberStatus, MemberType } from '../libs/enums/member.enum';

const DEMO_PASSWORD = 'KidsGardenDemo!2026';

const MemberModel = mongoose.model('Member', MemberSchema);
const KindergartenModel = mongoose.model('Kindergarten', KindergartenSchema);
const KindergartenStaffModel = mongoose.model('KindergartenStaff', KindergartenStaffSchema);
const BoardArticleModel = mongoose.model('BoardArticle', BoardArticleSchema);

type DemoMemberInput = {
	memberNick: string;
	memberFullName: string;
	memberEmail: string;
	memberPhone: string;
	memberType: MemberType;
	memberDesc: string;
};

type DemoKindergartenInput = {
	kindergartenTitle: string;
	kindergartenAddress: string;
	kindergartenType: KindergartenType;
	kindergartenLocation: KindergartenLocation;
	kindergartenLatitude: number;
	kindergartenLongitude: number;
	kindergartenPrice: number;
	kindergartenCapacity: number;
	kindergartenAgeRange: number;
	kindergartenPrograms: number;
	kindergartenViews: number;
	kindergartenLikes: number;
	kindergartenRank: number;
	kindergartenImages: string[];
	kindergartenDesc: string;
	establishedAt: Date;
};

type DemoArticleInput = {
	articleCategory: BoardArticleCategory;
	articleTitle: string;
	articleContent: string;
	articleImage: string;
	articleViews: number;
	articleLikes: number;
	authorKey: string;
};

type SeedSummary = {
	collections: string[];
	members: string[];
	kindergartens: string[];
	ownerStaffRecords: string[];
	officialArticles: string[];
	parentPosts: string[];
};

const demoMembers: Record<string, DemoMemberInput> = {
	editorial: {
		memberNick: 'KidsGarden Team',
		memberFullName: 'KidsGarden Team',
		memberEmail: 'editorial@kidsgarden.demo',
		memberPhone: 'KG-DEMO-TEAM',
		memberType: MemberType.SUPER_ADMIN,
		memberDesc: 'Official KidsGarden demo editorial account.',
	},
	centerAdmin: {
		memberNick: 'KidsGarden Demo Center Admin',
		memberFullName: 'KidsGarden Demo Center Admin',
		memberEmail: 'center-admin@kidsgarden.demo',
		memberPhone: 'KG-DEMO-CENTER-ADMIN',
		memberType: MemberType.KINDERGARTEN_ADMIN,
		memberDesc: 'Demo center owner account for seeded kindergartens.',
	},
	parentA: {
		memberNick: 'Demo Parent A',
		memberFullName: 'Demo Parent A',
		memberEmail: 'demo-parent-a@kidsgarden.demo',
		memberPhone: 'KG-DEMO-PARENT-A',
		memberType: MemberType.PARENT,
		memberDesc: 'Demo parent account for community seed content.',
	},
	parentB: {
		memberNick: 'Demo Parent B',
		memberFullName: 'Demo Parent B',
		memberEmail: 'demo-parent-b@kidsgarden.demo',
		memberPhone: 'KG-DEMO-PARENT-B',
		memberType: MemberType.PARENT,
		memberDesc: 'Demo parent account for community seed content.',
	},
	parentC: {
		memberNick: 'Demo Parent C',
		memberFullName: 'Demo Parent C',
		memberEmail: 'demo-parent-c@kidsgarden.demo',
		memberPhone: 'KG-DEMO-PARENT-C',
		memberType: MemberType.PARENT,
		memberDesc: 'Demo parent account for community seed content.',
	},
};

const demoKindergartens: DemoKindergartenInput[] = [
	{
		kindergartenTitle: 'Happy Kids Garden',
		kindergartenAddress: '12 Yongbong-ro, Buk-gu, Gwangju',
		kindergartenType: KindergartenType.PRIVATE_KINDERGARTEN,
		kindergartenLocation: KindergartenLocation.GWANGJU,
		kindergartenLatitude: 35.1799,
		kindergartenLongitude: 126.9124,
		kindergartenPrice: 420000,
		kindergartenCapacity: 40,
		kindergartenAgeRange: 6,
		kindergartenPrograms: 3,
		kindergartenViews: 230,
		kindergartenLikes: 46,
		kindergartenRank: 92,
		kindergartenImages: [
			'/img/kidsgarden/kindergartens/kg-01-exterior.png',
			'/img/kidsgarden/kindergartens/kg-01-classroom.png',
			'/img/kidsgarden/kindergartens/kg-01-yard.png',
			'/img/kidsgarden/facilities/facility-reading-corner.png',
		],
		kindergartenDesc:
			'Happy Kids Garden offers Montessori-inspired care, bilingual communication, and creative arts for children ages 3-6. Languages: Korean, English, Uzbek.',
		establishedAt: new Date('2018-03-01T00:00:00.000Z'),
	},
	{
		kindergartenTitle: 'Rainbow Learning Center',
		kindergartenAddress: '45 Campus-ro, Buk-gu, Gwangju',
		kindergartenType: KindergartenType.PUBLIC_KINDERGARTEN,
		kindergartenLocation: KindergartenLocation.GWANGJU,
		kindergartenLatitude: 35.1762,
		kindergartenLongitude: 126.9081,
		kindergartenPrice: 260000,
		kindergartenCapacity: 55,
		kindergartenAgeRange: 7,
		kindergartenPrograms: 3,
		kindergartenViews: 310,
		kindergartenLikes: 58,
		kindergartenRank: 88,
		kindergartenImages: [
			'/img/kidsgarden/kindergartens/kg-02-classroom.png',
			'/img/kidsgarden/kindergartens/kg-02-playroom.png',
			'/img/kidsgarden/facilities/facility-playground.png',
			'/img/kidsgarden/facilities/facility-lunch-room.png',
		],
		kindergartenDesc:
			'Rainbow Learning Center blends reading, outdoor play, and music movement in a calm public kindergarten setting. Languages: Korean, English.',
		establishedAt: new Date('2016-09-01T00:00:00.000Z'),
	},
	{
		kindergartenTitle: 'Little Forest Preschool',
		kindergartenAddress: '88 Suwan-ro, Gwangsan-gu, Gwangju',
		kindergartenType: KindergartenType.PRESCHOOL,
		kindergartenLocation: KindergartenLocation.GWANGJU,
		kindergartenLatitude: 35.1902,
		kindergartenLongitude: 126.8248,
		kindergartenPrice: 390000,
		kindergartenCapacity: 35,
		kindergartenAgeRange: 5,
		kindergartenPrograms: 3,
		kindergartenViews: 175,
		kindergartenLikes: 36,
		kindergartenRank: 81,
		kindergartenImages: [
			'/img/kidsgarden/kindergartens/kg-03-exterior.png',
			'/img/kidsgarden/kindergartens/kg-03-classroom.png',
			'/img/kidsgarden/kindergartens/kg-03-art-room.png',
			'/img/kidsgarden/facilities/facility-playroom.png',
		],
		kindergartenDesc:
			'Little Forest Preschool focuses on nature play, art, and social skills with warm teacher guidance for ages 2-5. Languages: Korean, English.',
		establishedAt: new Date('2020-03-01T00:00:00.000Z'),
	},
	{
		kindergartenTitle: 'Sunflower Kids Academy',
		kindergartenAddress: '21 Sangmu-daero, Seo-gu, Gwangju',
		kindergartenType: KindergartenType.EARLY_LEARNING_CENTER,
		kindergartenLocation: KindergartenLocation.GWANGJU,
		kindergartenLatitude: 35.1521,
		kindergartenLongitude: 126.8514,
		kindergartenPrice: 480000,
		kindergartenCapacity: 60,
		kindergartenAgeRange: 7,
		kindergartenPrograms: 4,
		kindergartenViews: 285,
		kindergartenLikes: 52,
		kindergartenRank: 90,
		kindergartenImages: [
			'/img/kidsgarden/kindergartens/kg-04-exterior.png',
			'/img/kidsgarden/kindergartens/kg-04-playroom.png',
			'/img/kidsgarden/kindergartens/kg-04-yard.png',
			'/img/kidsgarden/facilities/facility-music-room.png',
		],
		kindergartenDesc:
			'Sunflower Kids Academy offers bilingual learning, STEM play, music, and creative projects for ages 3-7. Languages: Korean, English.',
		establishedAt: new Date('2017-03-01T00:00:00.000Z'),
	},
	{
		kindergartenTitle: 'Green Tree Kindergarten',
		kindergartenAddress: '36 Pungam-ro, Seo-gu, Gwangju',
		kindergartenType: KindergartenType.PRIVATE_KINDERGARTEN,
		kindergartenLocation: KindergartenLocation.GWANGJU,
		kindergartenLatitude: 35.1328,
		kindergartenLongitude: 126.8795,
		kindergartenPrice: 350000,
		kindergartenCapacity: 45,
		kindergartenAgeRange: 6,
		kindergartenPrograms: 4,
		kindergartenViews: 205,
		kindergartenLikes: 41,
		kindergartenRank: 84,
		kindergartenImages: [
			'/img/kidsgarden/kindergartens/kg-05-exterior.png',
			'/img/kidsgarden/kindergartens/kg-05-classroom.png',
			'/img/kidsgarden/kindergartens/kg-05-group-activity.png',
			'/img/kidsgarden/kindergartens/kg-05-teacher-activity.png',
		],
		kindergartenDesc:
			'Green Tree Kindergarten provides daily care, outdoor learning, reading, and art in a friendly neighborhood center. Languages: Korean.',
		establishedAt: new Date('2019-03-01T00:00:00.000Z'),
	},
];

const officialArticles: DemoArticleInput[] = [
	{
		articleCategory: BoardArticleCategory.NEWS,
		articleTitle: 'Why Play-Based Learning Matters',
		articleContent:
			'Learning through play helps children practice language, problem solving, creativity, and cooperation in a natural daily rhythm.',
		articleImage: '/img/kidsgarden/articles/article-play-based-learning.png',
		articleViews: 160,
		articleLikes: 28,
		authorKey: 'editorial',
	},
	{
		articleCategory: BoardArticleCategory.NEWS,
		articleTitle: "5 Ways to Support Your Child's Confidence",
		articleContent:
			'Small routines, clear encouragement, patient listening, and chances to try again can help children feel safe as they grow.',
		articleImage: '/img/kidsgarden/articles/article-child-confidence.png',
		articleViews: 142,
		articleLikes: 24,
		authorKey: 'editorial',
	},
	{
		articleCategory: BoardArticleCategory.NEWS,
		articleTitle: 'A Smooth First Day at Kindergarten',
		articleContent:
			'Prepare a simple morning plan, talk about the classroom, and keep goodbye warm and predictable so the first day feels easier.',
		articleImage: '/img/kidsgarden/articles/article-first-day-kindergarten.png',
		articleViews: 138,
		articleLikes: 22,
		authorKey: 'editorial',
	},
	{
		articleCategory: BoardArticleCategory.NEWS,
		articleTitle: 'How Parents and Teachers Can Communicate Better',
		articleContent:
			'Helpful communication is short, respectful, and specific. Share context, ask clear questions, and keep the child at the center.',
		articleImage: '/img/kidsgarden/articles/article-parent-teacher-communication.png',
		articleViews: 154,
		articleLikes: 30,
		authorKey: 'editorial',
	},
	{
		articleCategory: BoardArticleCategory.NEWS,
		articleTitle: 'Healthy Lunch Ideas for Busy Kindergarten Days',
		articleContent:
			'Simple balanced lunches with familiar foods, fruit, vegetables, and easy portions can make kindergarten meals calmer.',
		articleImage: '/img/kidsgarden/articles/article-healthy-lunch.png',
		articleViews: 126,
		articleLikes: 19,
		authorKey: 'editorial',
	},
	{
		articleCategory: BoardArticleCategory.NEWS,
		articleTitle: 'Creating a Safe Kindergarten Environment',
		articleContent:
			'Safety starts with trusted adults, clear routines, secure access, age-friendly spaces, and open communication with families.',
		articleImage: '/img/kidsgarden/articles/article-safe-kindergarten.png',
		articleViews: 148,
		articleLikes: 27,
		authorKey: 'editorial',
	},
];

const parentPosts: DemoArticleInput[] = [
	{
		articleCategory: BoardArticleCategory.FREE,
		articleTitle: 'How did your child adjust during the first week?',
		articleContent:
			'Our first week had a few tears, but a predictable goodbye helped. What worked for your family during the first days?',
		articleImage: '/img/kidsgarden/articles/article-kindergarten-adaptation.png',
		articleViews: 88,
		articleLikes: 13,
		authorKey: 'parentA',
	},
	{
		articleCategory: BoardArticleCategory.FREE,
		articleTitle: 'What do you usually pack for kindergarten lunch?',
		articleContent:
			'I am looking for lunch ideas that stay fresh and are easy for small hands. What are your reliable favorites?',
		articleImage: '/img/kidsgarden/articles/article-healthy-lunch.png',
		articleViews: 74,
		articleLikes: 10,
		authorKey: 'parentB',
	},
	{
		articleCategory: BoardArticleCategory.FREE,
		articleTitle: 'Best ways to build a morning routine',
		articleContent:
			'We are trying picture cards and preparing the bag at night. Any tips for keeping mornings calm before kindergarten?',
		articleImage: '/img/kidsgarden/articles/article-daily-routine.png',
		articleViews: 92,
		articleLikes: 16,
		authorKey: 'parentC',
	},
	{
		articleCategory: BoardArticleCategory.FREE,
		articleTitle: 'How do you encourage shy children to join group play?',
		articleContent:
			'My child likes watching first before joining. I would love gentle ideas from parents who have been through this.',
		articleImage: '/img/kidsgarden/articles/article-social-skills.png',
		articleViews: 81,
		articleLikes: 14,
		authorKey: 'parentA',
	},
	{
		articleCategory: BoardArticleCategory.FREE,
		articleTitle: 'Reading habits before bedtime',
		articleContent:
			'Bedtime reading is becoming our favorite quiet moment. Which short books or routines help your child settle?',
		articleImage: '/img/kidsgarden/articles/article-reading-habits.png',
		articleViews: 69,
		articleLikes: 11,
		authorKey: 'parentB',
	},
	{
		articleCategory: BoardArticleCategory.FREE,
		articleTitle: 'Outdoor play after kindergarten',
		articleContent:
			'Some days my child still has lots of energy after pickup. Do you go to the playground, walk, or keep afternoons quiet?',
		articleImage: '/img/kidsgarden/articles/article-outdoor-play.png',
		articleViews: 77,
		articleLikes: 12,
		authorKey: 'parentC',
	},
	{
		articleCategory: BoardArticleCategory.FREE,
		articleTitle: 'Creative activities for rainy days',
		articleContent:
			'Rainy weekends are tricky. We tried collage and building blocks. What simple activities keep your children happily busy?',
		articleImage: '/img/kidsgarden/articles/article-creative-activities.png',
		articleViews: 84,
		articleLikes: 15,
		authorKey: 'parentA',
	},
	{
		articleCategory: BoardArticleCategory.FREE,
		articleTitle: 'What should parents ask before choosing a kindergarten?',
		articleContent:
			'I am making a visit checklist. What questions helped you understand safety, teachers, daily routines, and communication?',
		articleImage: '/img/kidsgarden/articles/article-parent-teacher-communication.png',
		articleViews: 96,
		articleLikes: 17,
		authorKey: 'parentB',
	},
];

function getMongoUri(): string {
	const uri = process.env.NODE_ENV === 'production' ? process.env.MONGO_PROD : process.env.MONGO_DEV;
	if (!uri) throw new Error('MongoDB URI is missing. Expected MONGO_PROD in production or MONGO_DEV otherwise.');

	return uri;
}

function createSummary(): SeedSummary {
	return {
		collections: ['members', 'kindergartens', 'kindergartenStaffs', 'boardArticles'],
		members: [],
		kindergartens: [],
		ownerStaffRecords: [],
		officialArticles: [],
		parentPosts: [],
	};
}

async function upsertDemoMember(key: string, input: DemoMemberInput, applyChanges: boolean, summary: SeedSummary) {
	const existing = await MemberModel.findOne({
		$or: [{ memberEmail: input.memberEmail }, { memberNick: input.memberNick }, { memberPhone: input.memberPhone }],
	}).exec();

	if (!applyChanges) {
		summary.members.push(`${existing ? 'would update/reuse' : 'would create'} ${key}: ${input.memberNick}`);
		return existing;
	}

	const memberPayload = {
		memberType: input.memberType,
		memberStatus: MemberStatus.ACTIVE,
		memberAuthType: MemberAuthType.EMAIL,
		memberPhone: input.memberPhone,
		memberEmail: input.memberEmail,
		memberNick: input.memberNick,
		memberFullName: input.memberFullName,
		memberDesc: input.memberDesc,
	};

	const member = existing
		? await MemberModel.findByIdAndUpdate(existing._id, { $set: memberPayload }, { new: true }).exec()
		: await MemberModel.create({
				...memberPayload,
				memberPassword: bcrypt.hashSync(DEMO_PASSWORD, 10),
		  });

	summary.members.push(`${existing ? 'reused/updated' : 'created'} ${key}: ${member.memberNick} (${member._id})`);
	return member;
}

async function upsertKindergarten(input: DemoKindergartenInput, ownerId: mongoose.Types.ObjectId, applyChanges: boolean, summary: SeedSummary) {
	const existing = await KindergartenModel.findOne({
		kindergartenTitle: input.kindergartenTitle,
		kindergartenAddress: input.kindergartenAddress,
	}).exec();

	if (!applyChanges) {
		summary.kindergartens.push(`${existing ? 'would update/reuse' : 'would create'} ${input.kindergartenTitle}`);
		return existing;
	}

	const payload = {
		...input,
		kindergartenStatus: KindergartenStatus.ACTIVE,
		memberId: ownerId,
		deletedAt: null,
	};

	const kindergarten = existing
		? await KindergartenModel.findByIdAndUpdate(existing._id, { $set: payload }, { new: true }).exec()
		: await KindergartenModel.create(payload);

	const staff = await KindergartenStaffModel.findOneAndUpdate(
		{ kindergartenId: kindergarten._id, memberId: ownerId },
		{ $set: { staffRole: StaffRole.OWNER, staffStatus: StaffStatus.ACTIVE } },
		{ new: true, upsert: true, setDefaultsOnInsert: true },
	).exec();

	summary.kindergartens.push(`${existing ? 'updated' : 'created'} ${kindergarten.kindergartenTitle} (${kindergarten._id})`);
	summary.ownerStaffRecords.push(`owner staff active for ${kindergarten.kindergartenTitle} (${staff._id})`);
	return kindergarten;
}

async function upsertArticle(
	input: DemoArticleInput,
	author: any,
	applyChanges: boolean,
	summaryList: string[],
) {
	const existing = await BoardArticleModel.findOne({ articleTitle: input.articleTitle }).exec();

	if (!applyChanges) {
		summaryList.push(`${existing ? 'would update/reuse' : 'would create'} ${input.articleTitle}`);
		return existing;
	}

	const articlePayload = {
		articleCategory: input.articleCategory,
		articleStatus: BoardArticleStatus.ACTIVE,
		articleTitle: input.articleTitle,
		articleContent: input.articleContent,
		articleImage: input.articleImage,
		articleViews: input.articleViews,
		articleLikes: input.articleLikes,
		memberId: author._id,
	};

	const article = existing
		? await BoardArticleModel.findByIdAndUpdate(existing._id, { $set: articlePayload }, { new: true }).exec()
		: await BoardArticleModel.create(articlePayload);

	summaryList.push(`${existing ? 'updated' : 'created'} ${article.articleTitle} (${article._id})`);
	return article;
}

async function updateDemoMemberStats(membersByKey: Record<string, any>, applyChanges: boolean): Promise<void> {
	if (!applyChanges) return;

	for (const member of Object.values(membersByKey)) {
		const [memberKindergartens, memberArticles] = await Promise.all([
			KindergartenModel.countDocuments({ memberId: member._id, kindergartenStatus: { $ne: KindergartenStatus.DELETE } }).exec(),
			BoardArticleModel.countDocuments({ memberId: member._id, articleStatus: { $ne: BoardArticleStatus.DELETE } }).exec(),
		]);

		await MemberModel.findByIdAndUpdate(member._id, {
			$set: {
				memberKindergartens,
				memberArticles,
			},
		}).exec();
	}
}

async function seedDemoContent(applyChanges: boolean): Promise<SeedSummary> {
	const summary = createSummary();
	const membersByKey: Record<string, any> = {};

	for (const [key, memberInput] of Object.entries(demoMembers)) {
		membersByKey[key] = await upsertDemoMember(key, memberInput, applyChanges, summary);
	}

	if (!applyChanges) {
		for (const input of demoKindergartens) await upsertKindergarten(input, new mongoose.Types.ObjectId(), false, summary);
		for (const input of officialArticles) await upsertArticle(input, null, false, summary.officialArticles);
		for (const input of parentPosts) await upsertArticle(input, null, false, summary.parentPosts);
		return summary;
	}

	const centerAdmin = membersByKey.centerAdmin;
	for (const input of demoKindergartens) {
		await upsertKindergarten(input, centerAdmin._id, applyChanges, summary);
	}

	for (const input of officialArticles) {
		await upsertArticle(input, membersByKey[input.authorKey], applyChanges, summary.officialArticles);
	}

	for (const input of parentPosts) {
		await upsertArticle(input, membersByKey[input.authorKey], applyChanges, summary.parentPosts);
	}

	await updateDemoMemberStats(membersByKey, applyChanges);
	return summary;
}

function printSection(title: string, rows: string[]): void {
	console.log(`\n${title}:`);
	for (const row of rows) console.log(`- ${row}`);
}

function printSummary(summary: SeedSummary, applyChanges: boolean): void {
	console.log(`Mode: ${applyChanges ? 'APPLY' : 'DRY RUN'}`);
	printSection('Collections used', summary.collections);
	printSection('Members', summary.members);
	printSection('Kindergartens', summary.kindergartens);
	printSection('Kindergarten owner staff records', summary.ownerStaffRecords);
	printSection('Official KidsGarden articles', summary.officialArticles);
	printSection('Parent community posts', summary.parentPosts);

	if (!applyChanges) console.log('\nDry run only. Re-run with --apply to write demo seed data.');
}

async function main(): Promise<void> {
	const applyChanges = process.argv.includes('--apply');

	await mongoose.connect(getMongoUri());
	console.log(`Connected to ${process.env.NODE_ENV === 'production' ? 'production' : 'development'} database.`);

	const summary = await seedDemoContent(applyChanges);
	printSummary(summary, applyChanges);
}

main()
	.catch((err) => {
		console.error('Demo seed failed:', err);
		process.exitCode = 1;
	})
	.finally(async () => {
		await mongoose.disconnect();
	});
