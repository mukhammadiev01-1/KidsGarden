import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common'; // NestJS interceptor va logging uchun kerak
import { GqlContextType, GqlExecutionContext } from '@nestjs/graphql'; // GraphQL request context bilan ishlash
import { Observable } from 'rxjs'; // asinxron oqimlarni boshqarish uchun
import { tap } from 'rxjs/operators'; // response qaytishidan oldin side effect (log) qilish uchun

@Injectable() // class ni NestJS DI container ga service sifatida ro‘yxatdan o‘tkazadi
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger: Logger = new Logger(); // NestJS built-in logger

  public intercept(context: ExecutionContext, next: CallHandler): Observable<any> { // interceptor vazifasi, request va response ni ushlab turadi
    const recordTime = Date.now(); // request boshlangan vaqt
    const requestType = context.getType<GqlContextType>(); // request turi: http yoki graphql

    if (requestType === 'http') {
      /* Develop if needed! */ // keyinchalik REST API uchun ishlatish mumkin
      return next.handle();
    } else if (requestType === 'graphql') {
      /* (1) Print Request */
      const gqlContext = GqlExecutionContext.create(context); // GraphQL context yaratish
      this.logger.log(`${this.stringify(gqlContext.getContext().req.body)}`, 'REQUEST'); // request body ni log qiladi

      /* (2) Errors handing via GraphQL */
      /* (3) No Errors, giving Response below */
      return next.handle().pipe( // request ni keyingi layer ga yuboradi
        tap((context) => { // response qaytishidan oldin ishlaydi
          const responseTime = Date.now() - recordTime; // qancha vaqt ketganini hisoblaydi
          this.logger.log(`${this.stringify(context)} - ${responseTime}ms \n\n`, 'RESPONSE'); // response + time log
        }),
      );
    }
  }

  private stringify(context: ExecutionContext): string { // object ni string ko‘rinishga o‘tkazadi
    return JSON.stringify(context).slice(0, 75); // log juda uzun bo‘lmasligi uchun 75 ta belgigacha
  }
}