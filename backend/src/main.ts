import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger, BadRequestException } from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { Env } from './env.validation';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  const config = app.get(ConfigService<Env>);
  const frontendUrl = config.get<string>('FRONTEND_URL', { infer: true })!;
  const port = config.get<number>('PORT', { infer: true }) ?? 3001;
  const nodeEnv = config.get<string>('NODE_ENV', { infer: true });

  // Segurança HTTP — desabilita CSP apenas na rota do Swagger em dev
  app.use(
    helmet({
      contentSecurityPolicy: nodeEnv === 'production' ? undefined : false,
    }),
  );

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
      // Retorna erros estruturados com o nome do campo para o frontend mapear por input
      exceptionFactory: (validationErrors: ValidationError[]) => {
        const errors = validationErrors.flatMap((err) =>
          Object.values(err.constraints ?? {}).map(
            (msg) => `${err.property}:${msg}`,
          ),
        );
        return new BadRequestException(errors);
      },
    }),
  );

  // Filtro global de exceções — impede vazamento de stack trace
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Swagger — disponível apenas fora de produção
  if (nodeEnv !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('MyScreen TV API')
      .setDescription(
        'API do MyScreen TV — catalogação de séries e filmes. ' +
        'Endpoints marcados com o cadeado requerem autenticação via cookie JWT (faça login primeiro em POST /auth/login).',
      )
      .setVersion('1.0')
      .addCookieAuth('access_token')
      .addTag('Auth', 'Registro, login, refresh e logout')
      .addTag('Users', 'Perfil do usuário e sistema de follows')
      .addTag('Shows', 'Séries — listagem, busca e detalhes')
      .addTag('Movies', 'Filmes — listagem, busca e detalhes')
      .addTag('Watch', 'Progresso de episódios e filmes assistidos')
      .addTag('Lists', 'Listas personalizadas do usuário')
      .addTag('Feed', 'Descobrir, próximos episódios e continuar assistindo')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });

    logger.log(`Swagger disponível em http://localhost:${port}/api/docs`);
  }

  await app.listen(port);
  logger.log(`Backend rodando em http://localhost:${port}`);
}

bootstrap();
