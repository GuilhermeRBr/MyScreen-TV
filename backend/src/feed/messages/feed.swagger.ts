/**
 * Documentação Swagger do módulo Feed.
 */
export const FEED_SWAGGER = {
  getDiscover: {
    operation: {
      summary: 'Descobrir conteúdo',
      description:
        'Retorna séries e filmes em tendência para a tela de exploração. Os dados são agregados do TMDB e não são personalizados por usuário.',
    },
    responses: {
      200: 'Objeto com arrays trendingShows e trendingMovies.',
      401: 'Não autenticado.',
    },
  },
  getUpcoming: {
    operation: {
      summary: 'Próximos episódios',
      description:
        'Retorna os episódios que serão exibidos nos próximos 30 dias das séries que o usuário está acompanhando (status WATCHING ou REWATCHING).',
    },
    responses: {
      200: 'Array de episódios futuros com dados da série e data de exibição.',
      401: 'Não autenticado.',
    },
  },
  getContinueWatching: {
    operation: {
      summary: 'Continuar assistindo',
      description:
        'Retorna o próximo episódio não assistido de cada série que o usuário acompanha. Alimentado pelo WatchProgress do usuário.',
    },
    responses: {
      200: 'Array com o próximo episódio por série, ordenado por última atividade.',
      401: 'Não autenticado.',
    },
  },
} as const;
