import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { NotificationModule } from '../notification/notification.module';
import { StaffApplicationResolver } from './staff-application.resolver';
import { StaffApplicationService } from './staff-application.service';
import StaffApplicationSchema from '../../shemas/StaffApplication.model';
import KindergartenSchema from '../../shemas/Kindergarten.model';
import KindergartenStaffSchema from '../../shemas/KindergartenStaff.model';
import MemberSchema from '../../shemas/Member.model';

@Module({
	imports: [
		MongooseModule.forFeature([{ name: 'StaffApplication', schema: StaffApplicationSchema }]),
		MongooseModule.forFeature([{ name: 'Kindergarten', schema: KindergartenSchema }]),
		MongooseModule.forFeature([{ name: 'KindergartenStaff', schema: KindergartenStaffSchema }]),
		MongooseModule.forFeature([{ name: 'Member', schema: MemberSchema }]),
		AuthModule,
		NotificationModule,
	],
	providers: [StaffApplicationResolver, StaffApplicationService],
	exports: [StaffApplicationService],
})
export class StaffApplicationModule {}
