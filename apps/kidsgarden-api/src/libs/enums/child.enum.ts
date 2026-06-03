import { registerEnumType } from '@nestjs/graphql';

export enum ChildGender {
	BOY = 'BOY',
	GIRL = 'GIRL',
}

registerEnumType(ChildGender, {
	name: 'ChildGender',
});

export enum ChildStatus {
	ACTIVE = 'ACTIVE',
	INACTIVE = 'INACTIVE',
	GRADUATED = 'GRADUATED',
	TRANSFERRED = 'TRANSFERRED',
}

registerEnumType(ChildStatus, {
	name: 'ChildStatus',
});
