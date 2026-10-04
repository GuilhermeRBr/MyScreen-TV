import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { Env } from '../env.validation';
import { buildPasswordResetEmailHtml } from './templates/password-reset.template';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend;
  private readonly mailFrom: string;

  constructor(private readonly config: ConfigService<Env>) {
    this.resend = new Resend(
      config.get<string>('RESEND_API_KEY', { infer: true }),
    );
    this.mailFrom = config.get<string>('MAIL_FROM', { infer: true })!;
  }

  async sendPasswordResetEmail(
    toEmail: string,
    resetLink: string,
  ): Promise<void> {
    const html = buildPasswordResetEmailHtml(resetLink);

    const { error } = await this.resend.emails.send({
      from: this.mailFrom,
      to: toEmail,
      subject: 'Redefinição de senha — MyScreen TV',
      html,
    });

    if (error) {
      // Log técnico — nunca vaza para o cliente
      this.logger.error(
        `Falha ao enviar e-mail de recuperação para ${toEmail}: ${error.message}`,
      );
      throw new Error('Falha ao enviar e-mail de recuperação de senha.');
    }
  }
}
