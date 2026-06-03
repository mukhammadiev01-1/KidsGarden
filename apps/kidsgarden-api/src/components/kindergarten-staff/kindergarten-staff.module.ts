import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { KindergartenStaffResolver } from './kindergarten-staff.resolver';
import { KindergartenStaffService } from './kindergarten-staff.service';
import KindergartenStaffSchema from '../../shemas/KindergartenStaff.model';
import KindergartenSchema from '../../shemas/Kindergarten.model';
import MemberSchema from '../../shemas/Member.model';

@Module({
	imports: [
		MongooseModule.forFeature([{ name: 'KindergartenStaff', schema: KindergartenStaffSchema }]),
		MongooseModule.forFeature([{ name: 'Kindergarten', schema: KindergartenSchema }]),
		MongooseModule.forFeature([{ name: 'Member', schema: MemberSchema }]),
		AuthModule,
	],
	providers: [KindergartenStaffResolver, KindergartenStaffService],
	exports: [KindergartenStaffService],
})
export class KindergartenStaffModule {}
