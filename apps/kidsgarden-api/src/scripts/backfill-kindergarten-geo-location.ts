import 'dotenv/config';
import mongoose from 'mongoose';
import KindergartenSchema from '../shemas/Kindergarten.model';
import {
	buildKindergartenGeoLocation,
	KindergartenGeoLocation,
	isSameKindergartenGeoLocation,
} from '../libs/utils/kindergarten-geo-location.util';

type KindergartenGeoBackfillDoc = {
	_id: mongoose.Types.ObjectId;
	kindergartenTitle?: string;
	kindergartenLatitude?: number;
	kindergartenLongitude?: number;
	kindergartenGeoLocation?: KindergartenGeoLocation;
};

type BackfillCandidate = {
	id: string;
	title?: string;
	geoLocation: KindergartenGeoLocation;
	reason: 'missing' | 'different';
};

type BackfillSummary = {
	mode: 'dry-run' | 'apply';
	scanned: number;
	invalidCoordinates: number;
	alreadyCurrent: number;
	toUpdate: BackfillCandidate[];
	applied: number;
};

const KindergartenModel = mongoose.model<KindergartenGeoBackfillDoc>('Kindergarten', KindergartenSchema);
const applyChanges = process.argv.includes('--apply');

function getMongoUri(): string {
	const uri = process.env.NODE_ENV === 'production' ? process.env.MONGO_PROD : process.env.MONGO_DEV;
	if (!uri) throw new Error('MongoDB URI is missing. Expected MONGO_PROD in production or MONGO_DEV otherwise.');

	return uri;
}

async function getBackfillCandidates(): Promise<Omit<BackfillSummary, 'mode' | 'applied'>> {
	const docs = await KindergartenModel.find({
		kindergartenLatitude: { $exists: true, $ne: null },
		kindergartenLongitude: { $exists: true, $ne: null },
	})
		.select('_id kindergartenTitle kindergartenLatitude kindergartenLongitude kindergartenGeoLocation')
		.lean()
		.exec();

	const summary: Omit<BackfillSummary, 'mode' | 'applied'> = {
		scanned: docs.length,
		invalidCoordinates: 0,
		alreadyCurrent: 0,
		toUpdate: [],
	};

	for (const doc of docs) {
		const geoLocation = buildKindergartenGeoLocation(doc.kindergartenLatitude, doc.kindergartenLongitude);
		if (!geoLocation) {
			summary.invalidCoordinates++;
			continue;
		}

		if (isSameKindergartenGeoLocation(doc.kindergartenGeoLocation, geoLocation)) {
			summary.alreadyCurrent++;
			continue;
		}

		summary.toUpdate.push({
			id: doc._id.toString(),
			title: doc.kindergartenTitle,
			geoLocation,
			reason: doc.kindergartenGeoLocation ? 'different' : 'missing',
		});
	}

	return summary;
}

async function applyBackfill(candidates: BackfillCandidate[]): Promise<number> {
	let applied = 0;

	for (const candidate of candidates) {
		const result = await KindergartenModel.updateOne(
			{ _id: candidate.id },
			{ $set: { kindergartenGeoLocation: candidate.geoLocation } },
			{ timestamps: false },
		).exec();

		applied += result.modifiedCount ?? 0;
	}

	return applied;
}

async function main(): Promise<void> {
	await mongoose.connect(getMongoUri());

	try {
		const candidateSummary = await getBackfillCandidates();
		const applied = applyChanges ? await applyBackfill(candidateSummary.toUpdate) : 0;
		const summary: BackfillSummary = {
			mode: applyChanges ? 'apply' : 'dry-run',
			...candidateSummary,
			applied,
		};

		console.log(JSON.stringify(summary, null, 2));
		if (!applyChanges) {
			console.log('Dry run only. Re-run with --apply to persist kindergartenGeoLocation updates.');
		}
	} finally {
		await mongoose.disconnect();
	}
}

main().catch(async (err) => {
	console.error(err instanceof Error ? err.message : err);
	await mongoose.disconnect();
	process.exit(1);
});
