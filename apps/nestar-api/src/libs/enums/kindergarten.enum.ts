import { registerEnumType } from '@nestjs/graphql';

export enum KindergartenType {
	APARTMENT = 'APARTMENT',
	VILLA = 'VILLA',
	HOUSE = 'HOUSE',
}
registerEnumType(KindergartenType, {
	name: 'KindergartenType',
});

export enum KindergartenStatus {
	ACTIVE = 'ACTIVE',
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
