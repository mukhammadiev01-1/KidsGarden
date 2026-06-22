export interface KindergartenGeoLocation {
	type: 'Point';
	coordinates: [number, number];
}

const toFiniteNumber = (value?: number | string | null): number | null => {
	if (typeof value === 'number') return Number.isFinite(value) ? value : null;
	if (typeof value === 'string' && value.trim()) {
		const parsed = Number(value);
		return Number.isFinite(parsed) ? parsed : null;
	}

	return null;
};

export const isValidLatitude = (value?: number | string | null): value is number => {
	const latitude = toFiniteNumber(value);
	return latitude !== null && latitude >= -90 && latitude <= 90;
};

export const isValidLongitude = (value?: number | string | null): value is number => {
	const longitude = toFiniteNumber(value);
	return longitude !== null && longitude >= -180 && longitude <= 180;
};

export const buildKindergartenGeoLocation = (
	latitude?: number | string | null,
	longitude?: number | string | null,
): KindergartenGeoLocation | undefined => {
	const parsedLatitude = toFiniteNumber(latitude);
	const parsedLongitude = toFiniteNumber(longitude);

	if (!isValidLatitude(parsedLatitude) || !isValidLongitude(parsedLongitude)) return undefined;

	return {
		type: 'Point',
		coordinates: [parsedLongitude, parsedLatitude],
	};
};

export const isSameKindergartenGeoLocation = (
	current: KindergartenGeoLocation | null | undefined,
	next: KindergartenGeoLocation,
): boolean => {
	if (current?.type !== 'Point' || current.coordinates?.length !== 2) return false;

	return current.coordinates[0] === next.coordinates[0] && current.coordinates[1] === next.coordinates[1];
};
