import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { RedisModule } from '../redis/redis.module';
import { NotificationResolver } from './notification.resolver';
import { NotificationService } from './notification.service';
import MemberSchema from '../../shemas/Member.model';
import NotificationSchema from '../../shemas/Notification.model';

@Module({
	imports: [
		MongooseModule.forFeature([{ name: 'Notification', schema: NotificationSchema }]),
		MongooseModule.forFeature([{ name: 'Member', schema: MemberSchema }]),
		AuthModule,
		RedisModule,
	],
	providers: [NotificationResolver, NotificationService],
	exports: [NotificationService],
})
export class NotificationModule {}
