import { registerEnumType } from '@nestjs/graphql';

export enum ConversationType {
	APPLICATION_CHAT = 'APPLICATION_CHAT',
	PARENT_TEACHER_CHAT = 'PARENT_TEACHER_CHAT',
}

registerEnumType(ConversationType, {
	name: 'ConversationType',
});
