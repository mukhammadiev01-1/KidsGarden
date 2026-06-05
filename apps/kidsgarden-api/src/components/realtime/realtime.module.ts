import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RedisModule } from '../redis/redis.module';
import { RealtimeGateway } from './realtime.gateway';
import { RealtimeService } from './realtime.service';

@Module({
	imports: [AuthModule, RedisModule],
	providers: [RealtimeGateway, RealtimeService],
	exports: [RealtimeService],
})
export class RealtimeModule {}
