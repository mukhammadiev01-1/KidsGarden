import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const AuthMember = createParamDecorator((data: string, context: ExecutionContext | any) => { 
	let request: any;
	if (context.contextType === 'graphql') { 
		request = context.getArgByIndex(2).req; 
		if (request.body.authMember) {
			request.body.authMember.authorization = request.headers?.authorization;
		}
	} else request = context.switchToHttp().getRequest();

	const member = request.body.authMember;

	if (member) return data ? member?.[data] : member;
	else return null;
});
//Bu dekorator, GraphQL yoki HTTP requestlarida authMember ni olish uchun ishlatiladi. 
// GraphQL uchun, request body ga authMember ni qo'yadi va HTTP uchun esa request body dan authMember ni oladi. 
// Agar data argumenti berilsa, authMember ning o'sha kindergarten sini qaytaradi, aks holda butun authMember ni qaytaradi.