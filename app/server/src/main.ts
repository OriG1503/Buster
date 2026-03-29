import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './shared/filters/global-exception.filter';

// Prevent unhandled promise rejections (e.g. Neon connection drops) from killing the process.
process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
});

// Prevent synchronous throws that escape all try/catch from killing the process.
process.on('uncaughtException', (error) => {
  console.error('[uncaughtException]', error);
});

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: process.env.CLIENT_URL ?? 'http://localhost:4200',
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  app.useGlobalFilters(new GlobalExceptionFilter());
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
