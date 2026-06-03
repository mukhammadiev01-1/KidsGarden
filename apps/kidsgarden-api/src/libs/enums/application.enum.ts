import { registerEnumType } from '@nestjs/graphql';

export enum ApplicationStatus {
	PENDING = 'PENDING',
	REVIEWING = 'REVIEWING',
	APPROVED = 'APPROVED',
	REJECTED = 'REJECTED',
	CANCELED = 'CANCELED',
	NEED_MORE_INFO = 'NEED_MORE_INFO',
}

registerEnumType(ApplicationStatus, {
	name: 'ApplicationStatus',
});
