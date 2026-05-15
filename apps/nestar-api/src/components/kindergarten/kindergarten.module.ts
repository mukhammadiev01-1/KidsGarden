import { Module } from '@nestjs/common';
import { KindergartenResolver } from './kindergarten.resolver';
import { KindergartenService } from './kindergarten.service';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { ViewModule } from '../view/view.module';
import { MemberModule } from '../member/member.module';
import KindergartenSchema from '../../shemas/Kindergarten.model';
import { LikeModule } from '../like/like.module';
import KindergartenStaffSchema from '../../shemas/KindergartenStaff.model';

@Module({
  imports: [
    MongooseModule.forFeature([ // MongooseModule orqali Kindergarten modelini MongoDB bilan ulaydi, bu yerda name: 'Kindergarten' va schema: KindergartenSchema ni belgilaydi
      {
        name: 'Kindergarten',
        schema: KindergartenSchema,
      },
      {
        name: 'KindergartenStaff',
        schema: KindergartenStaffSchema,
      },
    ]),
    AuthModule, // AuthModule ni import qiladi, bu yerda kindergarten resolver va service da authentication va authorization uchun
    ViewModule, // ViewModule ni import qiladi, bu yerda mulk ko'rish statistikasi va boshqa view bilan bog'liq funksiyalar uchun
    MemberModule, // MemberModule ni import qiladi, bu yerda mulk egasi va boshqa member bilan bog'liq funksiyalar uchun
    LikeModule, // LikeModule ni import qiladi, bu yerda mulkga like qo'shish va like bilan bog'liq funksiyalar uchun
  ],
  providers: [KindergartenResolver, KindergartenService], // KindergartenResolver va KindergartenService ni provider sifatida ro'yxat qiladi, bu yerda resolver GraphQL so'rovlarini boshqaradi va service esa biznes logikasini amalga oshiradi
  exports: [KindergartenService], // KindergartenService ni export qiladi, bu yerda boshqa modullar uni import qilib ishlatishi mumkin
})
export class KindergartenModule {}
