import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { LoggingInterceptor } from './libs/interceptor/Logging.interceptor';
import { graphqlUploadExpress } from 'graphql-upload';
import * as express from 'express';
import { WsAdapter } from '@nestjs/platform-ws';

async function bootstrap() {
	// NestJS ilovasini yaratish uchun bootstrap funksiyasi
	const app = await NestFactory.create(AppModule); // NestJS ilovasini yaratadi va AppModule ni asosiy modul sifatida ishlatadi
	app.useGlobalPipes(new ValidationPipe()); //
	app.useGlobalInterceptors(new LoggingInterceptor()); // global interceptor ni qo'llaydi, bu yerda LoggingInterceptor har bir request va response ni log qiladi
	app.enableCors({ origin: true, credentials: true }); // CORS ni yoqadi, bu frontend va backend o'rtasida cross-origin so'rovlarni ruxsat beradi

	app.use(graphqlUploadExpress({ maxFileSize: 15000000, maxFiles: 10 })); // GraphQL orqali file upload ni qo'llab-quvvatlaydi, maxFileSize va maxFiles ni belgilaydi
	app.use('/uploads', express.static('./uploads')); // uploads papkasini statik fayl sifatida xizmat qiladi, bu yerda upload qilingan fayllar saqlanadi // URL

	app.useWebSocketAdapter(new WsAdapter(app)); // WebSocket adapterini qo'llaydi, bu WebSocket orqali real-time kommunikatsiyani ta'minlaydi
	await app.listen(process.env.PORT_API ?? 3000); // ilovani belgilangan portda ishga tushiradi, PORT_API muhit o'zgaruvchisi bo'lmasa 3000 portida ishga tushadi
}
bootstrap();
