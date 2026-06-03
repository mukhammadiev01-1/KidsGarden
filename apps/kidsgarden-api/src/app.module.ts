import { Module } from '@nestjs/common'; // NestJS dan Module dekoratorini import qiladi
import { AppController } from './app.controller'; // app controller faylini import qiladi
import { AppService } from './app.service'; // app service faylini import qiladi
import { ConfigModule } from '@nestjs/config'; // .env va config uchun modulni import qiladi
import { GraphQLModule } from '@nestjs/graphql'; // GraphQL modulini import qiladi
import { ApolloDriver } from '@nestjs/apollo'; // Apollo GraphQL driverini import qiladi
import { AppResolver } from './app.resolver'; // GraphQL resolver faylini import qiladi
import { ComponentsModule } from './components/components.module'; // barcha component modullarni birlashtiruvchi modul
import { DatabaseModule } from './database/database.module'; // database ulanish moduli
import { T } from './libs/types/common';
import { SocketModule } from './socket/socket.module';

@Module({
  imports: [ // loyihada ishlatiladigan modullar ro'yxati
    ConfigModule.forRoot(), // env fayllarni global tarzda yuklaydi
    GraphQLModule.forRoot({ // GraphQL uchun asosiy konfiguratsiya
      driver: ApolloDriver, // Apollo driver orqali GraphQL ishlaydi
      playground: true, // brauzerda GraphQL playground ni yoqadi
      uploads: false, // GraphQL orqali file upload ni o'chiradi
      autoSchemaFile: true, // schema faylni avtomatik yaratadi
      formatError: (error: T) => { // GraphQL xatolik formatini belgilaydi, bu yerda error ni konsolga chiqaradi va kerakli formatda qaytaradi
  console.log('error:', error);
  const graphQLFormattedError = { // GraphQL xatolik formatini belgilaydi
    code: error?.extensions.code,
    message: //
      error?.extensions?.exception?.response?.message ||
      error?.extensions?.response?.message ||
      error?.message
  };

  console.log('GRAPHQL GLOBAL ERR:', graphQLFormattedError);
  return graphQLFormattedError;
},
    }),
    ComponentsModule, // business logic component modullarini ulaydi 
    DatabaseModule, SocketModule, // MongoDB / database modulini ulaydi
  ],
  controllers: [AppController], // REST APIcontroller lar shu yerda ro'yxat qilinadi
  providers: [AppService, AppResolver], // service va resolver(GRAPHQL) lar shu yerda ishlaydi
})
export class AppModule {} // butun loyihaning asosiy root moduli
