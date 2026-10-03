import { Field, InputType } from '@nestjs/graphql';
import { IsIn, IsNotEmpty, Length, Matches } from 'class-validator';

export const EXPO_PUSH_TOKEN_PATTERN = /^Expo(nent)?PushToken\[[A-Za-z0-9_-]+\]$/;

@InputType()
export class PushDeviceInput {
	@IsNotEmpty()
	@Length(20, 200)
	@Matches(EXPO_PUSH_TOKEN_PATTERN)
	@Field(() => String)
	token: string;

	@IsNotEmpty()
	@IsIn(['ios', 'android'])
	@Field(() => String)
	platform: string;
}
