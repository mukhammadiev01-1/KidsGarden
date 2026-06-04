import { registerEnumType } from '@nestjs/graphql';

export enum ConversationType {
	APPLICATION_CHAT = 'APPLICATION_CHAT',
}

registerEnumType(ConversationType, {
	name: 'ConversationType',
});
