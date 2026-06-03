import { Module } from '@nestjs/common';
import { BatchController } from './batch.controller';
import { BatchService } from './batch.service';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { ScheduleModule } from '@nestjs/schedule';
import MemberSchema from 'apps/kidsgarden-api/src/shemas/Member.model';
import KindergartenSchema from 'apps/kidsgarden-api/src/shemas/Kindergarten.model';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
	imports: [
		ConfigModule.forRoot(),
		DatabaseModule,
		ScheduleModule.forRoot(),
		MongooseModule.forFeature([{ name: 'Kindergarten', schema: KindergartenSchema }]),
		MongooseModule.forFeature([{ name: 'Member', schema: MemberSchema }]),
	],
	controllers: [BatchController],
	providers: [BatchService],
})
export class KidsGardenBatchModule {}
