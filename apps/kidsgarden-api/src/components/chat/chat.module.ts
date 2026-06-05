import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { NotificationModule } from '../notification/notification.module';
import { RedisModule } from '../redis/redis.module';
import { ChatResolver } from './chat.resolver';
import { ChatService } from './chat.service';
import ApplicationSchema from '../../shemas/Application.model';
import ConversationSchema from '../../shemas/Conversation.model';
import KindergartenStaffSchema from '../../shemas/KindergartenStaff.model';
import MessageSchema from '../../shemas/Message.model';

@Module({
	imports: [
		MongooseModule.forFeature([{ name: 'Application', schema: ApplicationSchema }]),
		MongooseModule.forFeature([{ name: 'Conversation', schema: ConversationSchema }]),
		MongooseModule.forFeature([{ name: 'KindergartenStaff', schema: KindergartenStaffSchema }]),
		MongooseModule.forFeature([{ name: 'Message', schema: MessageSchema }]),
		AuthModule,
		NotificationModule,
		RedisModule,
	],
	providers: [ChatResolver, ChatService],
	exports: [ChatService],
})
export class ChatModule {}
