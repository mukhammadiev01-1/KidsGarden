import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable()
export class WithoutGuard implements CanActivate {
	constructor(private authService: AuthService) {}

	async canActivate(context: ExecutionContext | any): Promise<boolean> {
		console.info('--- @guard() Authentication [WithoutGuard] ---');

		if (context.contextType === 'graphql') {
			const request = context.getArgByIndex(2).req,
				bearerToken = request.headers.authorization;

			if (bearerToken) {
				try {
					const token = bearerToken.split(' ')[1],
						authMember = await this.authService.authenticateToken(token);
					request.body.authMember = authMember;
				} catch (err) {
					request.body.authMember = null;
				}
			} else request.body.authMember = null;

			console.log('memberNick[without] =>', request.body.authMember?.memberNick ?? 'none');
			return true;
		}

		// description => http, rpc, gprs and etc are ignored
	}
}
// bu mantiqning vazifasfi, agar token mavjud bo'lsa, uni tekshirish va authMember ni request body ga qo'yish, agar token bo'lmasa yoki noto'g'ri bo'lsa, authMember ni null qilish. 
// Bu guard, autentifikatsiya talab qilinmaydigan, lekin mavjud bo'lsa foydalanuvchi ma'lumotlarini olish mumkin bo'lgan route lar uchun ishlatiladi.
