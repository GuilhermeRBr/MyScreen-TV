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
        'Retorna os episódios que serão exibidos nos próximos 3 meses de todas as séries que o usuário segue, independentemente do status. Inclui tmdbId, network e dados completos do episódio para a timeline "Em breve".',
    },
    responses: {
      200: 'Array de episódios futuros com dados da série, network e data de exibição, ordenados por airDate.',
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
  getUpcomingMovies: {
    operation: {
      summary: 'Filmes em breve',
      description:
        'Retorna todos os filmes da watchlist do usuário com data de lançamento futura, sem limite de janela, ordenados por releaseDate crescente.',
    },
    responses: {
      200: 'Array de filmes com tmdbId, título, poster, releaseDate e gêneros.',
      401: 'Não autenticado.',
    },
  },
} as const;
