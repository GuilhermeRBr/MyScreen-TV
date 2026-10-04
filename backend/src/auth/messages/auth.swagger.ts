/**
 * Documentação Swagger do módulo Auth.
 * Mantém as descrições de operações e respostas fora dos controllers.
 */
export const AUTH_SWAGGER = {
  register: {
    operation: {
      summary: 'Criar nova conta',
      description:
        'Registra um novo usuário e já retorna os cookies HttpOnly de autenticação (access_token e refresh_token). Rate limit: 5 tentativas por minuto por IP.',
    },
    responses: {
      201: 'Conta criada. Cookies access_token e refresh_token definidos.',
      400: 'Email ou username já em uso, ou dados de validação inválidos.',
      429: 'Muitas tentativas. Aguarde antes de tentar novamente.',
    },
  },
  login: {
    operation: {
      summary: 'Fazer login',
      description:
        'Autentica o usuário com email e senha e define os cookies HttpOnly de acesso (15 min) e refresh (7 dias). Rate limit: 10 tentativas por minuto por IP.',
    },
    responses: {
      200: 'Login realizado. Cookies access_token e refresh_token definidos.',
      401: 'Credenciais inválidas (email ou senha incorretos).',
      429: 'Muitas tentativas. Aguarde antes de tentar novamente.',
    },
  },
  refresh: {
    operation: {
      summary: 'Renovar tokens',
      description:
        'Troca o refresh_token atual por um novo par de tokens (rotação de token). O cookie refresh_token precisa estar presente. O token usado é imediatamente revogado.',
    },
    responses: {
      200: 'Tokens renovados. Novos cookies definidos.',
      401: 'Refresh token inválido, expirado ou já revogado.',
    },
  },
  logout: {
    operation: {
      summary: 'Fazer logout',
      description:
        'Revoga o refresh token no banco de dados e limpa os cookies access_token e refresh_token do browser.',
    },
    responses: {
      200: 'Logout realizado. Cookies removidos.',
      401: 'Não autenticado.',
    },
  },
  forgotPassword: {
    operation: {
      summary: 'Solicitar recuperação de senha',
      description:
        'Envia um e-mail com link de recuperação de senha caso o endereço esteja cadastrado. ' +
        'A resposta é sempre genérica para evitar enumeração de usuários. ' +
        'Rate limit: 3 tentativas por minuto por IP.',
    },
    responses: {
      200: 'Instruções enviadas (resposta genérica independente do e-mail existir ou não).',
      400: 'Dados de validação inválidos.',
      429: 'Muitas tentativas. Aguarde antes de tentar novamente.',
    },
  },
  resetPassword: {
    operation: {
      summary: 'Redefinir senha',
      description:
        'Redefine a senha do usuário usando o token recebido por e-mail. ' +
        'O token é de uso único, expira em 15 minutos e é armazenado apenas como hash SHA-256. ' +
        'Todos os refresh tokens existentes são invalidados após a redefinição.',
    },
    responses: {
      200: 'Senha redefinida com sucesso.',
      400: 'Dados de validação inválidos.',
      401: 'Token inválido ou expirado.',
    },
  },
} as const;
