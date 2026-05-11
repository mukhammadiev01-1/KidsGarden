import { Module } from '@nestjs/common';
import { MemberResolver } from './member.resolver';
import { MemberService } from './member.service';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import MemberSchema from '../../shemas/Member.model';
import { ViewModule } from '../view/view.module';
import { KindergartenModule } from '../kindergarten/kindergarten.module';
import { Like } from '../../libs/dto/like/like';
import { LikeModule } from '../like/like.module';
import FollowSchema from '../../shemas/Follow.model';

@Module({
	imports: [
		MongooseModule.forFeature([{ name: 'Member', schema: MemberSchema }]),
		MongooseModule.forFeature([{ name: 'Follow', schema: FollowSchema }]),
		AuthModule,
		ViewModule,
		LikeModule,
	],
	providers: [MemberResolver, MemberService],
	exports: [MemberService],
})
export class MemberModule {}
