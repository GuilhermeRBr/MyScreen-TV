/**
 * Tipos dos payloads dos jobs de e-mail.
 *
 * Regra de segurança: armazenar apenas o mínimo necessário no payload.
 * Nunca colocar tokens completos de recuperação, senhas ou qualquer segredo
 * que não precise ser enviado. O token já foi processado (hash) e o link
 * completo é montado aqui a partir dos dados mínimos.
 *
 * Para recuperação de senha, o rawToken é necessário para montar o link —
 * mas o payload fica em memória no Redis e não é logado em nenhum momento.
 */

export const EMAIL_JOB_NAMES = {
  SEND_PASSWORD_RESET: 'send-password-reset',
} as const;

export type EmailJobName = (typeof EMAIL_JOB_NAMES)[keyof typeof EMAIL_JOB_NAMES];

/**
 * Payload do job de e-mail de recuperação de senha.
 *
 * Consideração de segurança sobre o rawToken:
 * O token precisa ser transmitido ao worker para montar o link de redefinição.
 * Ele fica armazenado no Redis criptografado apenas se a instância Redis
 * tiver TLS habilitado (recomendado em produção via REDIS_TLS=true).
 * O link nunca é logado pelo worker — apenas o destinatário e o job ID.
 * O token expira em 15 minutos e é de uso único; mesmo que seja extraído
 * do Redis, só permite redefinir a senha do usuário correspondente.
 */
export interface PasswordResetEmailPayload {
  toEmail: string;
  rawToken: string;
  frontendUrl: string;
}

export type EmailJobPayload = PasswordResetEmailPayload;
