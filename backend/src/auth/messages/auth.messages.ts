/**
 * Mensagens de retorno do módulo Auth.
 * Centralizadas aqui para evitar strings espalhadas em services e controllers.
 */
export const AUTH_MESSAGES = {
  // Respostas de sucesso (corpo JSON)
  REGISTER_SUCCESS: 'Conta criada com sucesso',
  LOGIN_SUCCESS: 'Login realizado com sucesso',
  REFRESH_SUCCESS: 'Token renovado com sucesso',
  LOGOUT_SUCCESS: 'Logout realizado com sucesso',

  // Erros de negócio (lançados pelo service)
  EMAIL_IN_USE: 'Email já está em uso',
  USERNAME_IN_USE: 'Username já está em uso',
  INVALID_CREDENTIALS: 'Credenciais inválidas',
  INVALID_REFRESH_TOKEN: 'Refresh token inválido ou expirado',

  // Recuperação de senha
  FORGOT_PASSWORD_SENT: 'Se o e-mail estiver cadastrado, você receberá instruções para redefinir sua senha.',
  RESET_PASSWORD_SUCCESS: 'Senha redefinida com sucesso.',
  RESET_TOKEN_INVALID: 'Token inválido ou expirado.',
} as const;
