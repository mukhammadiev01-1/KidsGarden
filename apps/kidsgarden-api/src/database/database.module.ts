import { Module } from '@nestjs/common'; // NestJS dan Module dekoratorini import qiladi
import { InjectConnection, MongooseModule } from '@nestjs/mongoose'; // Mongoose modul va connection inject qilish uchun import
import { Connection } from 'mongoose'; // MongoDB connection type ni import qiladi

@Module({
  imports: [ // shu modul ichida ishlatiladigan modullar
    MongooseModule.forRootAsync({ // MongoDB ga async tarzda ulanish
      useFactory: () => ({ // dynamic config qaytaruvchi factory function
        uri: // database uri ni belgilaydi
          process.env.NODE_ENV === 'production' // agar production muhit bo'lsa
            ? process.env.MONGO_PROD // production db uri ni ishlatadi
            : process.env.MONGO_DEV, // aks holda development db uri ni ishlatadi
      }),
    }),
  ],
  exports: [MongooseModule], // boshqa modullarda ishlatish uchun export qiladi
})
export class DatabaseModule {
  constructor(
    @InjectConnection() private readonly connection: Connection, // MongoDB connection ni constructor ga inject qiladi
  ) {
    if (connection.readyState === 1) { // agar db muvaffaqiyatli ulangan bo'lsa
      console.log(
        `MongoDB is connected into ${
          process.env.NODE_ENV === 'production' // production yoki development ekanini tekshiradi
            ? 'production'
            : 'development'
        } db`,
      ); // qaysi db ga ulanganini console ga chiqaradi
    } else {
      console.log('DB is not connected!'); // ulanish bo'lmasa xabar chiqaradi
    }
  }
}