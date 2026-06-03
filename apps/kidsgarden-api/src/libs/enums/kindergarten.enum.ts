import { registerEnumType } from '@nestjs/graphql';

export enum KindergartenType {
	PRIVATE_KINDERGARTEN = 'PRIVATE_KINDERGARTEN',
	PUBLIC_KINDERGARTEN = 'PUBLIC_KINDERGARTEN',
	DAYCARE_CENTER = 'DAYCARE_CENTER',
	PRESCHOOL = 'PRESCHOOL',
	EARLY_LEARNING_CENTER = 'EARLY_LEARNING_CENTER',
	APARTMENT = 'APARTMENT',
	VILLA = 'VILLA',
	HOUSE = 'HOUSE',
}
registerEnumType(KindergartenType, {
	name: 'KindergartenType',
});

export enum KindergartenStatus {
	ACTIVE = 'ACTIVE',
	CLOSED = 'CLOSED',
	SOLD = 'SOLD',
	DELETE = 'DELETE',
}
registerEnumType(KindergartenStatus, {
	name: 'KindergartenStatus',
});

export enum KindergartenLocation {
	SEOUL = 'SEOUL',
	BUSAN = 'BUSAN',
	INCHEON = 'INCHEON',
	DAEGU = 'DAEGU',
	GYEONGJU = 'GYEONGJU',
	GWANGJU = 'GWANGJU',
	CHONJU = 'CHONJU',
	DAEJON = 'DAEJON',
	JEJU = 'JEJU',
}
registerEnumType(KindergartenLocation, {
	name: 'KindergartenLocation',
});
