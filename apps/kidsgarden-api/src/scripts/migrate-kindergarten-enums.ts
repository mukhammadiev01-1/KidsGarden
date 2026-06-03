import 'dotenv/config';
import mongoose from 'mongoose';
import KindergartenSchema from '../shemas/Kindergarten.model';
import { KindergartenStatus, KindergartenType } from '../libs/enums/kindergarten.enum';

type MigrationPair<T extends string> = {
	from: T;
	to: T;
};

type PlannedChange = {
	field: 'kindergartenType' | 'kindergartenStatus';
	from: string;
	to: string;
	count: number;
};

type CollisionRecord = {
	key: {
		kindergartenType: string;
		kindergartenLocation: string;
		kindergartenTitle: string;
		kindergartenPrice: number;
	};
	count: number;
	ids: string[];
	originalTypes: string[];
};

type ValueCount = {
	_id: string | null;
	count: number;
};

type AppliedChange = PlannedChange & {
	matchedCount: number;
	modifiedCount: number;
};

type Summary = {
	beforeChanges: PlannedChange[];
	afterChanges: PlannedChange[];
	collisions: CollisionRecord[];
	appliedChanges: AppliedChange[];
	typeCounts: ValueCount[];
	statusCounts: ValueCount[];
};

const KindergartenModel = mongoose.model('Kindergarten', KindergartenSchema);

const typeMigrations: MigrationPair<KindergartenType>[] = [
	{ from: KindergartenType.APARTMENT, to: KindergartenType.PRIVATE_KINDERGARTEN },
	{ from: KindergartenType.VILLA, to: KindergartenType.PUBLIC_KINDERGARTEN },
	{ from: KindergartenType.HOUSE, to: KindergartenType.DAYCARE_CENTER },
];

const statusMigrations: MigrationPair<KindergartenStatus>[] = [
	{ from: KindergartenStatus.SOLD, to: KindergartenStatus.CLOSED },
];

function getMongoUri(): string {
	const uri = process.env.NODE_ENV === 'production' ? process.env.MONGO_PROD : process.env.MONGO_DEV;
	if (!uri) throw new Error('MongoDB URI is missing. Expected MONGO_PROD in production or MONGO_DEV otherwise.');

	return uri;
}

async function getPlannedChanges(): Promise<PlannedChange[]> {
	const changes: PlannedChange[] = [];

	for (const migration of typeMigrations) {
		const count = await KindergartenModel.countDocuments({ kindergartenType: migration.from }).exec();
		changes.push({
			field: 'kindergartenType',
			from: migration.from,
			to: migration.to,
			count,
		});
	}

	for (const migration of statusMigrations) {
		const count = await KindergartenModel.countDocuments({ kindergartenStatus: migration.from }).exec();
		changes.push({
			field: 'kindergartenStatus',
			from: migration.from,
			to: migration.to,
			count,
		});
	}

	return changes;
}

async function getGroupedCounts(field: 'kindergartenType' | 'kindergartenStatus'): Promise<ValueCount[]> {
	return await KindergartenModel.aggregate([
		{ $group: { _id: `$${field}`, count: { $sum: 1 } } },
		{ $sort: { _id: 1 } },
	]).exec();
}

async function findTypeCollisionRisks(): Promise<CollisionRecord[]> {
	const collisions = await KindergartenModel.aggregate([
		{
			$addFields: {
				normalizedKindergartenType: {
					$switch: {
						branches: typeMigrations.map((migration) => ({
							case: { $eq: ['$kindergartenType', migration.from] },
							then: migration.to,
						})),
						default: '$kindergartenType',
					},
				},
			},
		},
		{
			$group: {
				_id: {
					kindergartenType: '$normalizedKindergartenType',
					kindergartenLocation: '$kindergartenLocation',
					kindergartenTitle: '$kindergartenTitle',
					kindergartenPrice: '$kindergartenPrice',
				},
				count: { $sum: 1 },
				ids: { $push: '$_id' },
				originalTypes: { $addToSet: '$kindergartenType' },
			},
		},
		{ $match: { count: { $gt: 1 } } },
		{ $limit: 50 },
	]).exec();

	return collisions.map((collision) => ({
		key: collision._id,
		count: collision.count,
		ids: collision.ids.map((id: mongoose.Types.ObjectId) => id.toString()),
		originalTypes: collision.originalTypes,
	}));
}

async function applyEnumMigrations(beforeChanges: PlannedChange[]): Promise<AppliedChange[]> {
	const appliedChanges: AppliedChange[] = [];

	for (const migration of typeMigrations) {
		const result: any = await KindergartenModel.updateMany(
			{ kindergartenType: migration.from },
			{ $set: { kindergartenType: migration.to } },
			{ timestamps: false },
		).exec();
		const planned = beforeChanges.find(
			(change) => change.field === 'kindergartenType' && change.from === migration.from && change.to === migration.to,
		);

		appliedChanges.push({
			field: 'kindergartenType',
			from: migration.from,
			to: migration.to,
			count: planned?.count ?? 0,
			matchedCount: result.matchedCount ?? result.n ?? 0,
			modifiedCount: result.modifiedCount ?? result.nModified ?? 0,
		});
	}

	for (const migration of statusMigrations) {
		const result: any = await KindergartenModel.updateMany(
			{ kindergartenStatus: migration.from },
			{ $set: { kindergartenStatus: migration.to } },
			{ timestamps: false },
		).exec();
		const planned = beforeChanges.find(
			(change) => change.field === 'kindergartenStatus' && change.from === migration.from && change.to === migration.to,
		);

		appliedChanges.push({
			field: 'kindergartenStatus',
			from: migration.from,
			to: migration.to,
			count: planned?.count ?? 0,
			matchedCount: result.matchedCount ?? result.n ?? 0,
			modifiedCount: result.modifiedCount ?? result.nModified ?? 0,
		});
	}

	return appliedChanges;
}

async function migrateKindergartenEnums(applyChanges: boolean): Promise<Summary> {
	const beforeChanges = await getPlannedChanges();
	const collisions = await findTypeCollisionRisks();
	let appliedChanges: AppliedChange[] = [];

	if (applyChanges) {
		if (collisions.length) {
			console.log('Apply blocked due to duplicate-key collision risk after normalized kindergartenType values.');
		} else {
			appliedChanges = await applyEnumMigrations(beforeChanges);
		}
	}

	return {
		beforeChanges,
		afterChanges: applyChanges && !collisions.length ? await getPlannedChanges() : [],
		collisions,
		appliedChanges,
		typeCounts: await getGroupedCounts('kindergartenType'),
		statusCounts: await getGroupedCounts('kindergartenStatus'),
	};
}

function printChanges(title: string, changes: PlannedChange[]): void {
	console.log(`\n${title}:`);
	for (const change of changes) {
		console.log(`- ${change.field}: ${change.from} -> ${change.to}: ${change.count}`);
	}
}

function printCollisions(collisions: CollisionRecord[]): void {
	if (!collisions.length) {
		console.log('\nDuplicate-key collision risks: none');
		return;
	}

	console.log('\nDuplicate-key collision risks:');
	for (const collision of collisions) {
		console.log(
			[
				`- type=${collision.key.kindergartenType}`,
				`location=${collision.key.kindergartenLocation}`,
				`title="${collision.key.kindergartenTitle}"`,
				`price=${collision.key.kindergartenPrice}`,
				`count=${collision.count}`,
				`originalTypes=${collision.originalTypes.join(',')}`,
				`ids=${collision.ids.join(',')}`,
			].join(' '),
		);
	}
}

function printAppliedChanges(changes: AppliedChange[]): void {
	if (!changes.length) return;

	console.log('\nApplied changes:');
	for (const change of changes) {
		console.log(
			`- ${change.field}: ${change.from} -> ${change.to}: planned=${change.count} matched=${change.matchedCount} modified=${change.modifiedCount}`,
		);
	}
}

function printGroupedCounts(title: string, counts: ValueCount[]): void {
	console.log(`\n${title}:`);
	for (const item of counts) {
		console.log(`- ${item._id ?? 'null'}: ${item.count}`);
	}
}

function printSummary(summary: Summary, applyChanges: boolean): void {
	console.log(`Mode: ${applyChanges ? 'APPLY' : 'DRY RUN'}`);
	printChanges('Before counts / planned changes', summary.beforeChanges);
	printCollisions(summary.collisions);

	if (!applyChanges) {
		console.log('\nDry run only. Re-run with --apply to write changes.');
	} else if (summary.collisions.length) {
		console.log('\nNo writes were applied because collision risks were found.');
	} else {
		printAppliedChanges(summary.appliedChanges);
		printChanges('After counts / remaining old values', summary.afterChanges);
	}

	printGroupedCounts('Grouped kindergartenType counts', summary.typeCounts);
	printGroupedCounts('Grouped kindergartenStatus counts', summary.statusCounts);
}

async function main(): Promise<void> {
	const applyChanges = process.argv.includes('--apply');

	await mongoose.connect(getMongoUri());
	console.log(`Connected to ${process.env.NODE_ENV === 'production' ? 'production' : 'development'} database.`);

	const summary = await migrateKindergartenEnums(applyChanges);
	printSummary(summary, applyChanges);
}

main()
	.catch((err) => {
		console.error('Kindergarten enum migration failed:', err);
		process.exitCode = 1;
	})
	.finally(async () => {
		await mongoose.disconnect();
	});
