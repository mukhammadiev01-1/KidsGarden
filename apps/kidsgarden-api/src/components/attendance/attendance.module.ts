import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { AttendanceResolver } from './attendance.resolver';
import { AttendanceService } from './attendance.service';
import AttendanceSchema from '../../shemas/Attendance.model';
import ChildSchema from '../../shemas/Child.model';
import GroupSchema from '../../shemas/Group.model';
import KindergartenStaffSchema from '../../shemas/KindergartenStaff.model';

@Module({
	imports: [
		MongooseModule.forFeature([{ name: 'Attendance', schema: AttendanceSchema }]),
		MongooseModule.forFeature([{ name: 'Child', schema: ChildSchema }]),
		MongooseModule.forFeature([{ name: 'Group', schema: GroupSchema }]),
		MongooseModule.forFeature([{ name: 'KindergartenStaff', schema: KindergartenStaffSchema }]),
		AuthModule,
	],
	providers: [AttendanceResolver, AttendanceService],
	exports: [AttendanceService],
})
export class AttendanceModule {}
