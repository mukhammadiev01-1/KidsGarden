import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { HttpModule } from '@nestjs/axios';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import MemberSchema from '../../shemas/Member.model';
import { SocialAuthService } from './social/social-auth.service';
import { GoogleProvider } from './social/providers/google.provider';
import { TelegramProvider } from './social/providers/telegram.provider';
import { KakaoProvider } from './social/providers/kakao.provider';

@Module({
  imports: [
    HttpModule,
    MongooseModule.forFeature([{ name: 'Member', schema: MemberSchema }]),
    JwtModule.register({
      secret: `${process.env.SECRET_TOKEN}`,
      signOptions: { expiresIn: '30d' },
    }),
  ],
  providers: [AuthService, SocialAuthService, GoogleProvider, TelegramProvider, KakaoProvider],
  exports: [AuthService, SocialAuthService],
})
export class AuthModule {}
