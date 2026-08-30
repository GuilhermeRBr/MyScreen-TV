import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { Env } from './env.validation';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  const config = app.get(ConfigService<Env>);
  const frontendUrl = config.get<string>('FRONTEND_URL', { infer: true })!;
  const port = config.get<number>('PORT', { infer: true }) ?? 3001;

  // Segurança HTTP
  app.use(helmet());

  // Cookie parser para JWT em HttpOnly cookies
  app.use(cookieParser());

  // CORS restrito à URL exata do frontend
  app.enableCors({
    origin: frontendUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Validação global de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Filtro global de exceções — impede vazamento de stack trace
  app.useGlobalFilters(new GlobalExceptionFilter());

  await app.listen(port);
  console.log(`Backend rodando em http://localhost:${port}`);
}

bootstrap();
