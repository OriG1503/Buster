import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './shared/filters/global-exception.filter';
import { LoggerService } from './shared/services/logger/logger.service';

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
  const logger = app.get(LoggerService);
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: process.env.CLIENT_URL ?? 'http://localhost:4200',
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  app.useGlobalFilters(app.get(GlobalExceptionFilter));
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  //LOG
  logger.info(`Server bootstrap complete — listening on port ${port}`, 'app-workflow');
}
bootstrap();
