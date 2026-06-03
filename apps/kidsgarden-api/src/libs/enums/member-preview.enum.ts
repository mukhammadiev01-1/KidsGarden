import { registerEnumType } from '@nestjs/graphql';

export enum PreviewMemberPurpose {
	PARENT_CANDIDATE = 'PARENT_CANDIDATE',
	STAFF_CANDIDATE = 'STAFF_CANDIDATE',
}

registerEnumType(PreviewMemberPurpose, {
	name: 'PreviewMemberPurpose',
});
