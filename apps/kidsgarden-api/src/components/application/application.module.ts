import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { ApplicationResolver } from './application.resolver';
import { ApplicationService } from './application.service';
import ApplicationSchema from '../../shemas/Application.model';
import KindergartenSchema from '../../shemas/Kindergarten.model';
import KindergartenStaffSchema from '../../shemas/KindergartenStaff.model';
import MemberSchema from '../../shemas/Member.model';

@Module({
	imports: [
		MongooseModule.forFeature([{ name: 'Application', schema: ApplicationSchema }]),
		MongooseModule.forFeature([{ name: 'Kindergarten', schema: KindergartenSchema }]),
		MongooseModule.forFeature([{ name: 'KindergartenStaff', schema: KindergartenStaffSchema }]),
		MongooseModule.forFeature([{ name: 'Member', schema: MemberSchema }]),
		AuthModule,
	],
	providers: [ApplicationResolver, ApplicationService],
	exports: [ApplicationService],
})
export class ApplicationModule {}
