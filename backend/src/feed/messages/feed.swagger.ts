/**
 * Documentação Swagger do módulo Feed.
 */
export const FEED_SWAGGER = {
  getDiscover: {
    operation: {
      summary: 'Descobrir conteúdo',
      description:
        'Retorna séries e filmes em tendência para a tela de exploração.',
    },
    responses: {
      200: 'Séries e filmes em tendência.',
      401: 'Não autenticado.',
    },
  },
  getUpcoming: {
    operation: {
      summary: 'Próximos episódios',
      description:
        'Retorna os episódios dos próximos 30 dias das séries que o usuário está acompanhando.',
    },
    responses: {
      200: 'Lista de próximos episódios.',
      401: 'Não autenticado.',
    },
  },
  getContinueWatching: {
    operation: {
      summary: 'Continuar assistindo',
      description:
        'Retorna o próximo episódio não assistido de cada série que o usuário está acompanhando.',
    },
    responses: {
      200: 'Lista de próximos episódios por série.',
      401: 'Não autenticado.',
    },
  },
} as const;
