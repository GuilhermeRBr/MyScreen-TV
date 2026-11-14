import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import { Env } from '../env.validation';
import { buildPasswordResetEmailHtml } from './templates/password-reset.template';

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: Transporter;
  private readonly mailFrom: string;
  private readonly isDev: boolean;

  constructor(private readonly config: ConfigService<Env>) {
    this.mailFrom = config.get<string>('MAIL_FROM', { infer: true })!;
    this.isDev = config.get<string>('NODE_ENV', { infer: true }) !== 'production';

    this.transporter = nodemailer.createTransport({
      host: config.get<string>('MAIL_HOST', { infer: true }),
      port: config.get<number>('MAIL_PORT', { infer: true }),
      secure: config.get<boolean>('MAIL_SECURE', { infer: true }),
      auth: {
        user: config.get<string>('MAIL_USER', { infer: true }),
        pass: config.get<string>('MAIL_PASSWORD', { infer: true }),
      },
    });
  }

  /**
   * Verifica a conexão SMTP ao inicializar o módulo.
   * Apenas registra um aviso em caso de falha — não impede o boot da aplicação.
   */
  async onModuleInit(): Promise<void> {
    if (this.isDev) {
      return;
    }

    try {
      await this.transporter.verify();
      this.logger.log('Conexão SMTP verificada com sucesso.');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Falha ao verificar conexão SMTP. Verifique as variáveis de ambiente. Detalhe: ${message}`,
      );
    }
  }

  async sendPasswordResetEmail(
    toEmail: string,
    resetLink: string,
  ): Promise<void> {
    // Em desenvolvimento, imprime o link no console e não chama o SMTP.
    // Útil para testar o fluxo sem configurar credenciais de e-mail.
    if (this.isDev) {
      this.logger.log(
        `[DEV] Link de recuperação para ${toEmail}: ${resetLink}`,
      );
      return;
    }

    const html = buildPasswordResetEmailHtml(resetLink);

    try {
      await this.transporter.sendMail({
        from: this.mailFrom,
        to: toEmail,
        subject: 'Redefinição de senha — MyScreen TV',
        html,
      });
    } catch (error) {
      // Log técnico — nunca vaza para o cliente
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Falha ao enviar e-mail de recuperação para ${toEmail}: ${message}`,
      );
      throw new Error('Falha ao enviar e-mail de recuperação de senha.');
    }
  }
}
