/**
 * Documentação Swagger do módulo Users.
 */
export const USERS_SWAGGER = {
  getMyProfile: {
    operation: {
      summary: 'Meu perfil',
      description: 'Retorna os dados do usuário autenticado.',
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
        'Atualiza nome de exibição, bio ou avatar do usuário autenticado.',
    },
    responses: {
      200: 'Perfil atualizado.',
      401: 'Não autenticado.',
    },
  },
  getPublicProfile: {
    operation: {
      summary: 'Perfil público',
      description: 'Retorna o perfil público de um usuário pelo username.',
    },
    responses: {
      200: 'Perfil público.',
      404: 'Usuário não encontrado.',
    },
  },
  follow: {
    operation: { summary: 'Seguir usuário' },
    responses: {
      201: 'Agora seguindo o usuário.',
      404: 'Usuário não encontrado.',
    },
  },
  unfollow: {
    operation: { summary: 'Deixar de seguir usuário' },
    responses: {
      200: 'Deixou de seguir.',
      404: 'Usuário não encontrado.',
    },
  },
} as const;
