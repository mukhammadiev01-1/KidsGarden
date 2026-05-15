import { registerEnumType } from '@nestjs/graphql';

export enum KindergartenAdminApplicationStatus {
	PENDING = 'PENDING',
	APPROVED = 'APPROVED',
	REJECTED = 'REJECTED',
	CANCELED = 'CANCELED',
}

registerEnumType(KindergartenAdminApplicationStatus, {
	name: 'KindergartenAdminApplicationStatus',
});
