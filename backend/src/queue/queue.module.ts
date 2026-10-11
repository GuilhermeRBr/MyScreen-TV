import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ConnectionOptions } from 'bullmq';
import { Env } from '../env.validation';
import { QUEUE_NAMES } from './queue.constants';

/**
 * Módulo central de filas.
 *
 * Responsabilidade única: registrar a conexão Redis e declarar as filas
 * disponíveis no sistema. Cada módulo de domínio (ex: EmailModule) importa
 * QueueModule para ter acesso às filas relevantes.
 *
 * Configuração de segurança:
 * - Credenciais vêm exclusivamente de variáveis de ambiente.
 * - TLS é habilitado via REDIS_TLS=true (obrigatório em produção).
 * - Política de memória: noeviction (padrão do BullMQ — nunca remover jobs
 *   arbitrariamente). Configure maxmemory-policy noeviction no Redis.
 *
 * Resiliência:
 * - maxRetriesPerRequest: null — o ioredis tenta reconectar indefinidamente
 *   em vez de falhar imediatamente em caso de indisponibilidade temporária.
 * - enableReadyCheck: false — necessário para compatibilidade com BullMQ.
 */
@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService<Env>): { connection: ConnectionOptions } => {
        const host = config.get<string>('REDIS_HOST', { infer: true })!;
        const port = config.get<number>('REDIS_PORT', { infer: true })!;
        const password = config.get<string>('REDIS_PASSWORD', { infer: true });
        const username = config.get<string>('REDIS_USERNAME', { infer: true });
        const db = config.get<number>('REDIS_DB', { infer: true }) ?? 0;
        const tls = config.get<boolean>('REDIS_TLS', { infer: true }) ?? false;

        const connection: ConnectionOptions = {
          host,
          port,
          db,
          // Autenticação opcional
          ...(password ? { password } : {}),
          ...(username ? { username } : {}),
          // TLS obrigatório em produção
          ...(tls ? { tls: {} } : {}),
          // Necessário para BullMQ — não falha imediatamente em reconexão
          maxRetriesPerRequest: null,
          enableReadyCheck: false,
          // Reconexão com backoff: aguarda até 3 s entre tentativas
          retryStrategy: (times: number) => Math.min(times * 500, 3000),
          // Encerra worker de forma limpa sem deixar conexões abertas
          lazyConnect: false,
        };

        return { connection };
      },
      inject: [ConfigService],
    }),

    // Declara a fila de e-mails com configurações de retenção
    BullModule.registerQueue({
      name: QUEUE_NAMES.EMAIL,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000, // 5 s, 10 s, 20 s
        },
        removeOnComplete: {
          age: 24 * 60 * 60, // mantém jobs concluídos por 24 h
          count: 500,        // mantém no máximo 500 jobs concluídos
        },
        removeOnFail: {
          age: 7 * 24 * 60 * 60, // mantém falhas por 7 dias para diagnóstico
          count: 100,
        },
      },
    }),
  ],
  exports: [BullModule],
})
export class QueueModule {}
