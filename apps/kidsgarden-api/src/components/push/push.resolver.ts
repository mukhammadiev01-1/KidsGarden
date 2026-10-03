import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { PushService } from './push.service';
import { PushDeviceInput } from '../../libs/dto/push/push.input';
import { Member } from '../../libs/dto/member/member';
import { MemberType } from '../../libs/enums/member.enum';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@Resolver()
export class PushResolver {
	constructor(private readonly pushService: PushService) {}

	@Roles(MemberType.PARENT, MemberType.TEACHER, MemberType.KINDERGARTEN_ADMIN, MemberType.SUPER_ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => Boolean)
	public async registerPushDevice(
		@Args('input') input: PushDeviceInput,
		@AuthMember() authMember: Member,
	): Promise<boolean> {
		console.log('Mutation: registerPushDevice');
		return await this.pushService.registerDevice(authMember, input);
	}

	@Roles(MemberType.PARENT, MemberType.TEACHER, MemberType.KINDERGARTEN_ADMIN, MemberType.SUPER_ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => Boolean)
	public async unregisterPushDevice(
		@Args('token') token: string,
		@AuthMember() authMember: Member,
	): Promise<boolean> {
		console.log('Mutation: unregisterPushDevice');
		return await this.pushService.unregisterDevice(authMember, token);
	}
}
