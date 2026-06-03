import { registerEnumType } from '@nestjs/graphql';

export enum StaffApplicationStatus {
	PENDING = 'PENDING',
	APPROVED = 'APPROVED',
	REJECTED = 'REJECTED',
	CANCELED = 'CANCELED',
}

registerEnumType(StaffApplicationStatus, {
	name: 'StaffApplicationStatus',
});
