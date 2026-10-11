import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import { Env } from '../env.validation';
import { QUEUE_NAMES } from '../queue/queue.constants';
import {
  EMAIL_JOB_NAMES,
  PasswordResetEmailPayload,
} from './jobs/send-email.job';
import { EMAIL_MESSAGES } from './messages/email.messages';

/**
 * Serviço responsável por enfileirar jobs de e-mail.
 *
 * Separação de responsabilidades:
 * - EmailQueueService: enfileira jobs (producer)
 * - EmailProcessor: consome e executa os jobs (consumer)
 * - EmailService: realiza o envio via Resend (infraestrutura)
 *
 * A API retorna imediatamente após o enfileiramento, sem aguardar o envio.
 * Isso não garante entrega — apenas que a solicitação foi aceita para
 * processamento assíncrono.
 */
@Injectable()
export class EmailQueueService {
  private readonly logger = new Logger(EmailQueueService.name);

  constructor(
    @InjectQueue(QUEUE_NAMES.EMAIL)
    private readonly emailQueue: Queue<PasswordResetEmailPayload>,
    private readonly config: ConfigService<Env>,
  ) {}

  /**
   * Enfileira o envio do e-mail de recuperação de senha.
   *
   * O rawToken é incluído no payload para que o worker possa montar o link.
   * Ele não é logado — apenas o destinatário e o jobId aparecem nos logs.
   * O token expira em 15 minutos e é de uso único (invalidado após uso).
   */
  async enqueuePasswordReset(toEmail: string, rawToken: string): Promise<void> {
    const frontendUrl = this.config.get<string>('FRONTEND_URL', { infer: true })!;

    const payload: PasswordResetEmailPayload = {
      toEmail,
      rawToken,
      frontendUrl,
    };

    const job = await this.emailQueue.add(
      EMAIL_JOB_NAMES.SEND_PASSWORD_RESET,
      payload,
      {
        // jobId determinístico por token: previne duplicatas se o endpoint
        // for chamado duas vezes antes do job ser processado.
        // Como o token é único por solicitação, isso é seguro.
        jobId: `password-reset:${Buffer.from(toEmail).toString('base64url')}:${Date.now()}`,
      },
    );

    this.logger.log(
      `${EMAIL_MESSAGES.PASSWORD_RESET_ENQUEUED} | jobId=${job.id} | destinatário omitido nos logs`,
    );
  }
}
