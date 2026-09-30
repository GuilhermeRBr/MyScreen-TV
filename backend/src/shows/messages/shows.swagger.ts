/**
 * Documentação Swagger do módulo Shows.
 */
export const SHOWS_SWAGGER = {
  getPopular: {
    operation: {
      summary: 'Séries populares',
      description: 'Retorna a lista de séries populares via TMDB.',
    },
    responses: { 200: 'Lista de séries populares.' },
  },
  getTrending: {
    operation: {
      summary: 'Séries em alta',
      description: 'Retorna as séries em tendência da semana via TMDB.',
    },
    responses: { 200: 'Lista de séries em alta.' },
  },
  search: {
    operation: {
      summary: 'Buscar séries',
      description: 'Pesquisa séries pelo nome via TMDB.',
    },
    responses: { 200: 'Resultados da busca.' },
  },
  getDetail: {
    operation: {
      summary: 'Detalhes de uma série',
      description:
        'Retorna detalhes completos de uma série pelo ID do TMDB, incluindo elenco. Sincroniza com o banco se necessário.',
    },
    responses: {
      200: 'Detalhes da série.',
      404: 'Série não encontrada.',
    },
  },
  getSeasons: {
    operation: { summary: 'Temporadas de uma série' },
    responses: {
      200: 'Lista de temporadas.',
      404: 'Série não encontrada.',
    },
  },
  getEpisodes: {
    operation: { summary: 'Episódios de uma temporada' },
    responses: {
      200: 'Lista de episódios da temporada.',
      404: 'Série ou temporada não encontrada.',
    },
  },
} as const;
