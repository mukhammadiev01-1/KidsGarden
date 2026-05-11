import { registerEnumType } from '@nestjs/graphql';

export enum StaffRole {
	OWNER = 'OWNER',
	ADMIN = 'ADMIN',
	TEACHER = 'TEACHER',
}

registerEnumType(StaffRole, {
	name: 'StaffRole',
});

export enum StaffStatus {
	ACTIVE = 'ACTIVE',
	PENDING = 'PENDING',
	BLOCKED = 'BLOCKED',
	REMOVED = 'REMOVED',
}

registerEnumType(StaffStatus, {
	name: 'StaffStatus',
});
