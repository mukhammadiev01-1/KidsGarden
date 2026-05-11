import { registerEnumType } from '@nestjs/graphql';

export enum GroupStatus {
	ACTIVE = 'ACTIVE',
	INACTIVE = 'INACTIVE',
	FULL = 'FULL',
	ARCHIVED = 'ARCHIVED',
}

registerEnumType(GroupStatus, {
	name: 'GroupStatus',
});
