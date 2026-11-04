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
      summary: 'Listar usuários (admin)',
      description:
        'Retorna usuários cadastrados de forma paginada, com dados de perfil, role e lastLoginAt. Parâmetros: page (padrão 1) e limit (padrão 50, máximo 100). Restrito a usuários com role ADMIN.',
    },
    responses: {
      200: '{ data: AdminUser[], total: number, page: number, totalPages: number }',
      403: 'Acesso negado. Requer role ADMIN.',
    },
  },
  getBannerImages: {
    operation: {
      summary: 'Imagens de banner do perfil',
      description:
        'Retorna os caminhos de backdrop das séries que o usuário acompanha e dos filmes na sua lista, para exibição no banner do perfil.',
    },
    responses: {
      200: 'Array de objetos com backdropPath.',
      401: 'Não autenticado.',
    },
  },
  toggleUserActive: {
    operation: {
      summary: 'Ativar ou desativar usuário (admin)',
      description:
        'Alterna o status isActive do usuário alvo. Ao desativar, todos os refresh tokens ativos são revogados imediatamente, encerrando todas as sessões. O admin não pode desativar a própria conta. Restrito a usuários com role ADMIN.',
    },
    responses: {
      200: '{ id: string, isActive: boolean }',
      400: 'Tentativa de desativar a própria conta.',
      403: 'Acesso negado. Requer role ADMIN.',
      404: 'Usuário não encontrado.',
    },
  },
} as const;
