import { BadRequestException, CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { Message } from 'apps/kidsgarden-api/src/libs/enums/common.enum';

@Injectable()
export class AuthGuard implements CanActivate {
	constructor(private authService: AuthService) {}

	async canActivate(context: ExecutionContext | any): Promise<boolean> {
		console.info('--- @guard() Authentication [AuthGuard] ---');

		if (context.contextType === 'graphql') {
			const request = context.getArgByIndex(2).req;

			const bearerToken = request.headers.authorization;
			if (!bearerToken) throw new BadRequestException(Message.TOKEN_NOT_EXIST);

			const token = bearerToken.split(' ')[1],
				authMember = await this.authService.authenticateToken(token);
			if (!authMember) throw new UnauthorizedException(Message.NOT_AUTHENTICATED);

			console.log('memberNick[auth] =>', authMember.memberNick);
			request.body.authMember = authMember; //bu authMember ni request body ga qo'yadi, shunda resolverlarda @AuthMember() dekoratori orqali authMember ni olish mumkin bo'ladi

			return true;
		}

		// description => http, rpc, gprs and etc are ignored
	}
}
//Bu mantiqning vazifasi, agar token mavjud bo'lsa, uni tekshirish va authMember ni request body ga qo'yish, agar token bo'lmasa yoki noto'g'ri bo'lsa, xatolik tashlash.
