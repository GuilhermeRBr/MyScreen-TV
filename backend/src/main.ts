import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger, BadRequestException } from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import * as basicAuth from 'express-basic-auth';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { Env } from './env.validation';
import { EMAIL_MESSAGES } from './email/messages/email.messages';

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

  // Bull Board — painel de inspeção de filas (desabilitado por padrão)
  // O BullBoardModule já está registrado no AppModule e configura a rota /queues.
  // Aqui protegemos a rota com autenticação básica quando habilitado.
  const enableBullBoard =
    config.get<boolean>('ENABLE_BULL_BOARD', { infer: true }) ?? false;
  if (enableBullBoard) {
    const bullBoardUser = config.get<string>('BULL_BOARD_USER', { infer: true });
    const bullBoardPassword = config.get<string>('BULL_BOARD_PASSWORD', {
      infer: true,
    });

    if (!bullBoardUser || !bullBoardPassword) {
      // Avisa e não expõe o painel sem credenciais configuradas
      logger.warn(EMAIL_MESSAGES.BULL_BOARD_CONFIG_INCOMPLETE);
    } else {
      // Middleware de autenticação básica aplicado ANTES de registrar a rota
      app.use(
        '/queues',
        basicAuth({
          users: { [bullBoardUser]: bullBoardPassword },
          challenge: true,
        }),
      );
      logger.log(`Bull Board disponível em http://localhost:${port}/queues`);
    }
  }

  // Swagger — disponível apenas fora de produção
  if (nodeEnv !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('MyScreen TV API')
      .setDescription(
        'API do MyScreen TV — catalogação de séries e filmes.\n\n' +
          '**Autenticacao:** endpoints marcados com o cadeado requerem JWT via cookie HttpOnly. ' +
          'Faca login em `POST /auth/login` e o cookie sera definido automaticamente.\n\n' +
          '**Rate limiting:** endpoints de auth possuem limite por IP (ver cada operacao).\n\n' +
          '**Roles:** o endpoint `GET /users/admin/list` requer role `ADMIN`.',
      )
      .setVersion('1.0')
      .addCookieAuth('access_token', {
        type: 'apiKey',
        in: 'cookie',
        name: 'access_token',
        description: 'Cookie HttpOnly definido automaticamente apos login.',
      })
      .addTag('Auth', 'Registro, login, renovacao de token e logout')
      .addTag('Users', 'Perfil do usuario autenticado, perfil publico e sistema de follows')
      .addTag('Shows', 'Series — listagem, busca, detalhes, temporadas e episodios (sem autenticacao)')
      .addTag('Movies', 'Filmes — listagem, busca e detalhes (sem autenticacao)')
      .addTag('Watch', 'Progresso de episodios e filmes: marcar como assistido, estatisticas')
      .addTag('Lists', 'Listas personalizadas: criar, gerenciar itens e excluir')
      .addTag('Feed', 'Tela inicial: descobrir conteudo, proximos episodios e continuar assistindo')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });

    logger.log(`Swagger disponível em http://localhost:${port}/api/docs`);
  }

  // Graceful shutdown — encerra workers BullMQ antes de sair
  app.enableShutdownHooks();

  const shutdown = async (signal: string): Promise<void> => {
    logger.log(`Sinal ${signal} recebido. Encerrando a aplicação...`);
    await app.close();
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));

  await app.listen(port);
  logger.log(`Backend rodando em http://localhost:${port}`);
}

bootstrap();
