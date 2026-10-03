/**
 * Documentação Swagger do módulo Shows.
 */
export const SHOWS_SWAGGER = {
  getPopular: {
    operation: {
      summary: 'Séries populares',
      description: 'Retorna a lista de séries populares via TMDB. Não requer autenticação.',
    },
    responses: { 200: 'Lista de séries populares.' },
  },
  getTrending: {
    operation: {
      summary: 'Séries em alta',
      description: 'Retorna as séries em tendência da semana via TMDB. Não requer autenticação.',
    },
    responses: { 200: 'Lista de séries em alta.' },
  },
  search: {
    operation: {
      summary: 'Buscar séries',
      description: 'Pesquisa séries pelo nome via TMDB. Parâmetro obrigatório: q. Não requer autenticação.',
    },
    responses: { 200: 'Resultados da busca.' },
  },
  getDetail: {
    operation: {
      summary: 'Detalhes de uma série',
      description:
        'Retorna detalhes completos de uma série pelo ID do TMDB, incluindo elenco e temporadas. Sincroniza com o banco se necessário. Não requer autenticação.',
    },
    responses: {
      200: 'Detalhes da série.',
      404: 'Série não encontrada.',
    },
  },
  getSeasons: {
    operation: {
      summary: 'Temporadas de uma série',
      description:
        'Retorna a lista de temporadas de uma série pelo ID do TMDB. Não requer autenticação.',
    },
    responses: {
      200: 'Lista de temporadas.',
      404: 'Série não encontrada.',
    },
  },
  getEpisodes: {
    operation: {
      summary: 'Episódios de uma temporada',
      description:
        'Retorna os episódios de uma temporada específica. Parâmetros: tmdbId da série e número da temporada. Não requer autenticação.',
    },
    responses: {
      200: 'Lista de episódios da temporada.',
      404: 'Série ou temporada não encontrada.',
    },
  },
} as const;
