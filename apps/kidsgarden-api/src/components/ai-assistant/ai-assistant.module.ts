import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AiAssistantResolver } from './ai-assistant.resolver';
import { AiAssistantService } from './ai-assistant.service';
import { RedisModule } from '../redis/redis.module';

@Module({
	imports: [AuthModule, RedisModule],
	providers: [AiAssistantResolver, AiAssistantService],
})
export class AiAssistantModule {}
