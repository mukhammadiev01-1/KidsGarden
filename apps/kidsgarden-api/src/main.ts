import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { LoggingInterceptor } from './libs/interceptor/Logging.interceptor';
import { graphqlUploadExpress } from 'graphql-upload';
import * as express from 'express';
import { WsAdapter } from '@nestjs/platform-ws';
import { join } from 'path';

function getPort(envValue: string | undefined, fallbackPort: number): number {
	if (!envValue) return fallbackPort;

	const port = Number(envValue);
	if (!Number.isInteger(port) || port <= 0 || port > 65535) {
		throw new Error(`Invalid PORT_API value "${envValue}". Expected a numeric port, e.g. ${fallbackPort}.`);
	}

	return port;
}

function parseOriginList(value: string | undefined): string[] {
	return (value || '')
		.split(',')
		.map((origin) => origin.trim())
		.filter(Boolean);
}

function getAllowedCorsOrigins(): string[] {
	const configuredOrigins = parseOriginList(process.env.CORS_ORIGIN);

	if (process.env.NODE_ENV === 'production') {
		if (configuredOrigins.length === 0) {
			throw new Error('CORS_ORIGIN must be configured in production.');
		}

		return configuredOrigins;
	}

	return [
		'http://127.0.0.1:7007',
		'http://localhost:7007',
		'http://127.0.0.1:3000',
		'http://localhost:3000',
		...configuredOrigins,
	];
}

async function bootstrap() {
	// NestJS ilovasini yaratish uchun bootstrap funksiyasi
	const app = await NestFactory.create(AppModule); // NestJS ilovasini yaratadi va AppModule ni asosiy modul sifatida ishlatadi
	app.useGlobalPipes(new ValidationPipe()); //
	app.useGlobalInterceptors(new LoggingInterceptor()); // global interceptor ni qo'llaydi, bu yerda LoggingInterceptor har bir request va response ni log qiladi
	const allowedCorsOrigins = getAllowedCorsOrigins();
	app.enableCors({
		origin: (origin, callback) => {
			if (!origin || allowedCorsOrigins.includes(origin)) {
				callback(null, true);
				return;
			}

			callback(new Error('Not allowed by CORS'));
		},
		credentials: true,
	}); // CORS ni faqat ruxsat berilgan frontend originlari uchun yoqadi

	app.use(graphqlUploadExpress({ maxFileSize: 15000000, maxFiles: 10 })); // GraphQL orqali file upload ni qo'llab-quvvatlaydi, maxFileSize va maxFiles ni belgilaydi
	app.use('/uploads', express.static(join(process.cwd(), 'uploads')));
	app.useWebSocketAdapter(new WsAdapter(app)); // WebSocket adapterini qo'llaydi, bu WebSocket orqali real-time kommunikatsiyani ta'minlaydi
	await app.listen(getPort(process.env.PORT_API, 3000)); // ilovani belgilangan portda ishga tushiradi, PORT_API muhit o'zgaruvchisi bo'lmasa 3000 portida ishga tushadi
}
bootstrap();
