import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { AppLoginResolver } from './app-login.resolver';
import { AppLoginService } from './app-login.service';
import AppLoginCodeSchema from '../../shemas/AppLoginCode.model';
import MemberSchema from '../../shemas/Member.model';

@Module({
	imports: [
		MongooseModule.forFeature([{ name: 'AppLoginCode', schema: AppLoginCodeSchema }]),
		MongooseModule.forFeature([{ name: 'Member', schema: MemberSchema }]),
		AuthModule,
	],
	providers: [AppLoginResolver, AppLoginService],
})
export class AppLoginModule {}
