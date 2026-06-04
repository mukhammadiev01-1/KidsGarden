import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { NotificationModule } from '../notification/notification.module';
import { KindergartenAdminApplicationResolver } from './kindergarten-admin-application.resolver';
import { KindergartenAdminApplicationService } from './kindergarten-admin-application.service';
import KindergartenAdminApplicationSchema from '../../shemas/KindergartenAdminApplication.model';
import MemberSchema from '../../shemas/Member.model';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: 'KindergartenAdminApplication', schema: KindergartenAdminApplicationSchema },
		]),
		MongooseModule.forFeature([{ name: 'Member', schema: MemberSchema }]),
		AuthModule,
		NotificationModule,
	],
	providers: [KindergartenAdminApplicationResolver, KindergartenAdminApplicationService],
	exports: [KindergartenAdminApplicationService],
})
export class KindergartenAdminApplicationModule {}
