/**
 * Mensagens de log e erro do módulo de e-mail e da fila de e-mails.
 * Seguindo o padrão do projeto: mensagens centralizadas por módulo.
 */
export const EMAIL_MESSAGES = {
  // Logs do processor
  JOB_STARTED: 'Processando job de e-mail',
  JOB_COMPLETED: 'Job de e-mail concluído',
  JOB_FAILED: 'Job de e-mail falhou',
  JOB_STALLED: 'Job de e-mail travado detectado',
  JOB_RETRYING: 'Tentando novamente o envio do e-mail',

  // Erros de configuração
  BULL_BOARD_CONFIG_INCOMPLETE:
    'Bull Board está habilitado mas BULL_BOARD_USER ou BULL_BOARD_PASSWORD não foram configurados. O painel não será registrado.',

  // Erros de envio
  SEND_PASSWORD_RESET_FAILED:
    'Falha ao enviar e-mail de recuperação de senha.',
  UNKNOWN_JOB_TYPE: 'Tipo de job desconhecido',

  // Enqueue
  PASSWORD_RESET_ENQUEUED: 'Job de recuperação de senha enfileirado',
} as const;
