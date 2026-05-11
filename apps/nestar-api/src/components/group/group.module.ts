import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { GroupResolver } from './group.resolver';
import { GroupService } from './group.service';
import GroupSchema from '../../shemas/Group.model';
import KindergartenSchema from '../../shemas/Kindergarten.model';
import KindergartenStaffSchema from '../../shemas/KindergartenStaff.model';
import MemberSchema from '../../shemas/Member.model';

@Module({
	imports: [
		MongooseModule.forFeature([{ name: 'Group', schema: GroupSchema }]),
		MongooseModule.forFeature([{ name: 'Kindergarten', schema: KindergartenSchema }]),
		MongooseModule.forFeature([{ name: 'KindergartenStaff', schema: KindergartenStaffSchema }]),
		MongooseModule.forFeature([{ name: 'Member', schema: MemberSchema }]),
		AuthModule,
	],
	providers: [GroupResolver, GroupService],
	exports: [GroupService],
})
export class GroupModule {}
