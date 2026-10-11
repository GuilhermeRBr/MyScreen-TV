import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QUEUE_NAMES } from '../queue/queue.constants';
import { EMAIL_JOB_NAMES, PasswordResetEmailPayload } from './jobs/send-email.job';
import { EmailService } from './email.service';
import { EMAIL_MESSAGES } from './messages/email.messages';

/**
 * Worker que consome os jobs da fila de e-mails.
 *
 * Concorrência:
 * - Lida de EMAIL_QUEUE_CONCURRENCY (padrão: 5).
 * - Para escalar, suba mais instâncias do backend apontando para o mesmo Redis.
 *   O BullMQ distribui os jobs automaticamente entre os workers.
 *
 * Retentativas:
 * - 3 tentativas com backoff exponencial: 5 s, 10 s, 20 s (configurado em QueueModule).
 * - Falhas esgotadas ficam retidas no Redis por 7 dias para diagnóstico.
 *
 * Idempotência:
 * - O envio via Resend não garante "exactly once" — uma retentativa após timeout
 *   pode resultar em e-mail duplicado.
 * - Para recuperação de senha, isso é aceitável: o usuário pode usar o link mais recente.
 */
@Processor(QUEUE_NAMES.EMAIL, {
  concurrency: parseInt(process.env['EMAIL_QUEUE_CONCURRENCY'] ?? '5', 10),
})
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private readonly emailService: EmailService) {
    super();
  }

  async process(job: Job<PasswordResetEmailPayload>): Promise<void> {
    this.logger.log(
      `${EMAIL_MESSAGES.JOB_STARTED} | jobId=${job.id} | name=${job.name} | tentativa=${job.attemptsMade + 1}`,
    );

    const startedAt = Date.now();

    switch (job.name) {
      case EMAIL_JOB_NAMES.SEND_PASSWORD_RESET:
        await this.processSendPasswordReset(job);
        break;

      default:
        // Job desconhecido: falha permanente, não deve ser reprocessado
        this.logger.error(
          `${EMAIL_MESSAGES.UNKNOWN_JOB_TYPE} | jobId=${job.id} | name=${job.name}`,
        );
        throw new Error(`${EMAIL_MESSAGES.UNKNOWN_JOB_TYPE}: ${job.name}`);
    }

    const duration = Date.now() - startedAt;
    this.logger.log(
      `${EMAIL_MESSAGES.JOB_COMPLETED} | jobId=${job.id} | name=${job.name} | duracao=${duration}ms`,
    );
  }

  private async processSendPasswordReset(
    job: Job<PasswordResetEmailPayload>,
  ): Promise<void> {
    const { toEmail, rawToken, frontendUrl } = job.data;

    // Monta o link aqui no worker — o rawToken não é logado em nenhum momento
    const resetLink = `${frontendUrl}/reset-password?token=${rawToken}`;

    await this.emailService.sendPasswordResetEmail(toEmail, resetLink);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<PasswordResetEmailPayload>, error: Error): void {
    const isFinalAttempt = job.attemptsMade >= (job.opts.attempts ?? 1);

    this.logger.error(
      `${EMAIL_MESSAGES.JOB_FAILED} | jobId=${job.id} | name=${job.name}` +
        ` | tentativa=${job.attemptsMade}/${job.opts.attempts ?? 1}` +
        ` | definitivo=${isFinalAttempt}` +
        ` | erro=${error.message}`,
    );
  }

  @OnWorkerEvent('stalled')
  onStalled(jobId: string): void {
    this.logger.warn(`${EMAIL_MESSAGES.JOB_STALLED} | jobId=${jobId}`);
  }
}
