/**
 * Documentação Swagger do módulo Users.
 */
export const USERS_SWAGGER = {
  getMyProfile: {
    operation: {
      summary: 'Meu perfil',
      description:
        'Retorna os dados completos do usuário autenticado, incluindo contadores de seguidores/seguindo e lastLoginAt.',
    },
    responses: {
      200: 'Dados do perfil.',
      401: 'Não autenticado.',
    },
  },
  updateProfile: {
    operation: {
      summary: 'Atualizar perfil',
      description:
        'Atualiza nome de exibição, bio ou URL do avatar do usuário autenticado. Apenas os campos enviados são modificados.',
    },
    responses: {
      200: 'Perfil atualizado.',
      400: 'Dados inválidos (ex: avatarUrl não é uma URL válida, displayName excede 60 caracteres).',
      401: 'Não autenticado.',
    },
  },
  getPublicProfile: {
    operation: {
      summary: 'Perfil público',
      description:
        'Retorna o perfil público de um usuário pelo username. Não expõe email, role ou lastLoginAt.',
    },
    responses: {
      200: 'Perfil público.',
      404: 'Usuário não encontrado.',
    },
  },
  follow: {
    operation: {
      summary: 'Seguir usuário',
      description:
        'Cria um relacionamento de follow entre o usuário autenticado e o alvo. Idempotente: chamar novamente não gera erro.',
    },
    responses: {
      201: 'Agora seguindo o usuário.',
      400: 'Tentativa de seguir a si mesmo.',
      404: 'Usuário não encontrado.',
    },
  },
  unfollow: {
    operation: {
      summary: 'Deixar de seguir usuário',
      description:
        'Remove o relacionamento de follow entre o usuário autenticado e o alvo. Idempotente: sem efeito se já não seguia.',
    },
    responses: {
      200: 'Deixou de seguir.',
      404: 'Usuário não encontrado.',
    },
  },
  adminListUsers: {
    operation: {
      summary: 'Listar usuarios (admin)',
      description:
        'Retorna todos os usuarios cadastrados com dados de perfil, role e lastLoginAt. Restrito a usuarios com role ADMIN.',
    },
    responses: {
      200: 'Array de usuarios ordenado por data de cadastro (mais recente primeiro).',
      403: 'Acesso negado. Requer role ADMIN.',
    },
  },
} as const;
