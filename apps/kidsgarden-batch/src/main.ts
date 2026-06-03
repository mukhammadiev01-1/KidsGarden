import { NestFactory } from '@nestjs/core';
import { KidsGardenBatchModule } from './batch.module';

async function bootstrap() {
	const app = await NestFactory.create(KidsGardenBatchModule);
	await app.listen(process.env.PORT_BATCH ?? 3000);
}
bootstrap();
