/**
 * Documentação Swagger do módulo Watch.
 */
export const WATCH_SWAGGER = {
  toggleEpisode: {
    operation: {
      summary: 'Marcar/desmarcar episódio como assistido',
      description:
        'Alterna o estado de assistido de um episódio pelo seu UUID interno. Se já foi assistido, remove o registro; caso contrário, cria um novo WatchProgress.',
    },
    responses: {
      201: 'Estado alternado. Retorna o novo estado (watched: true/false).',
      401: 'Não autenticado.',
      404: 'Episódio não encontrado.',
    },
  },
  markSeasonWatched: {
    operation: {
      summary: 'Marcar temporada inteira como assistida',
      description:
        'Marca todos os episódios de uma temporada como assistidos de uma só vez. Útil para séries que o usuário já assistiu anteriormente.',
    },
    responses: {
      201: 'Todos os episódios marcados. Retorna a quantidade de episódios afetados.',
      401: 'Não autenticado.',
      404: 'Temporada não encontrada.',
    },
  },
  getShowProgress: {
    operation: {
      summary: 'Progresso de uma série',
      description:
        'Retorna quantos episódios foram assistidos por temporada e o total geral da série. Identificado pelo UUID interno da série (não o tmdbId).',
    },
    responses: {
      200: 'Progresso por temporada com totais assistidos e disponíveis.',
      401: 'Não autenticado.',
    },
  },
  toggleMovie: {
    operation: {
      summary: 'Marcar/desmarcar filme como assistido',
      description:
        'Alterna o estado de assistido de um filme pelo seu UUID interno. Se já estava assistido, reverte para WATCHLIST; caso contrário, marca como WATCHED e registra watchedAt.',
    },
    responses: {
      201: 'Estado alternado. Retorna o novo status do filme.',
      401: 'Não autenticado.',
      404: 'Filme não encontrado.',
    },
  },
  addToWatchlist: {
    operation: {
      summary: 'Adicionar filme à watchlist',
      description:
        'Adiciona um filme à lista "quero assistir" (status WATCHLIST). Se o filme já existir em qualquer status, atualiza para WATCHLIST.',
    },
    responses: {
      201: 'Filme adicionado à watchlist.',
      401: 'Não autenticado.',
      404: 'Filme não encontrado.',
    },
  },
  getStats: {
    operation: {
      summary: 'Estatísticas do usuário',
      description:
        'Retorna o total de episódios assistidos, tempo total estimado de TV (em minutos), e a quantidade de filmes assistidos pelo usuário autenticado.',
    },
    responses: {
      200: 'Estatísticas de consumo: episodesWatched, totalMinutes, moviesWatched.',
      401: 'Não autenticado.',
    },
  },
} as const;
