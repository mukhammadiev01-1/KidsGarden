import { NestFactory } from '@nestjs/core';
import { KidsGardenBatchModule } from './batch.module';

function getPort(envValue: string | undefined, fallbackPort: number): number {
	if (!envValue) return fallbackPort;

	const port = Number(envValue);
	if (!Number.isInteger(port) || port <= 0 || port > 65535) {
		throw new Error(`Invalid PORT_BATCH value "${envValue}". Expected a numeric port, e.g. ${fallbackPort}.`);
	}

	return port;
}

async function bootstrap() {
	const app = await NestFactory.create(KidsGardenBatchModule);
	await app.listen(getPort(process.env.PORT_BATCH, 3001));
}
bootstrap();
