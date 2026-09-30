/**
 * Documentação Swagger do módulo Auth.
 * Mantém as descrições de operações e respostas fora dos controllers.
 */
export const AUTH_SWAGGER = {
  register: {
    operation: {
      summary: 'Criar nova conta',
      description:
        'Registra um novo usuário e já retorna os cookies de autenticação.',
    },
    responses: {
      201: 'Conta criada. Cookies access_token e refresh_token definidos.',
      400: 'Email ou username já em uso, ou dados inválidos.',
      429: 'Muitas tentativas. Aguarde antes de tentar novamente.',
    },
  },
  login: {
    operation: {
      summary: 'Fazer login',
      description:
        'Autentica o usuário e define os cookies HttpOnly de acesso e refresh.',
    },
    responses: {
      200: 'Login realizado. Cookies access_token e refresh_token definidos.',
      401: 'Credenciais inválidas.',
      429: 'Muitas tentativas. Aguarde antes de tentar novamente.',
    },
  },
  refresh: {
    operation: {
      summary: 'Renovar tokens',
      description:
        'Troca o refresh_token por um novo par de tokens (rotação). O cookie refresh_token deve estar presente.',
    },
    responses: {
      200: 'Tokens renovados.',
      401: 'Refresh token inválido ou expirado.',
    },
  },
  logout: {
    operation: {
      summary: 'Fazer logout',
      description:
        'Revoga o refresh token e limpa os cookies de autenticação.',
    },
    responses: {
      200: 'Logout realizado.',
      401: 'Não autenticado.',
    },
  },
} as const;
