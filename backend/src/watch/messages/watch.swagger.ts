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
  getMovieStatus: {
    operation: {
      summary: 'Status do filme na lista do usuário',
      description:
        'Retorna o status atual (WATCHLIST, WATCHED ou null) e a data em que foi marcado como assistido, se houver.',
    },
    responses: {
      200: '{ status: "WATCHLIST" | "WATCHED" | null, watchedAt: string | null }',
      401: 'Não autenticado.',
    },
  },
  removeFromList: {
    operation: {
      summary: 'Remover filme da lista do usuário',
      description:
        'Remove completamente o registro MovieWatch do usuário para o filme informado, independentemente do status atual (WATCHLIST ou WATCHED).',
    },
    responses: {
      200: 'Filme removido da lista.',
      401: 'Não autenticado.',
      404: 'Registro não encontrado.',
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
        'Retorna o total de episódios assistidos, filmes assistidos, tempo total (séries + filmes), tempo somente de séries e tempo somente de filmes, todos em minutos.',
    },
    responses: {
      200: 'Estatísticas: totalEpisodesWatched, totalMoviesWatched, totalMinutesWatched, seriesMinutesWatched, moviesMinutesWatched.',
      401: 'Não autenticado.',
    },
  },
  getUserMovies: {
    operation: {
      summary: 'Filmes do usuário',
      description:
        'Retorna todos os filmes que o usuário marcou como assistido (WATCHED) ou adicionou à watchlist (WATCHLIST), com dados do filme e status. Ordenado por atualização mais recente.',
    },
    responses: {
      200: 'Array de { status, watchedAt, movie } ordenado por updatedAt desc.',
      401: 'Não autenticado.',
    },
  },
  getUserSubscriptions: {
    operation: {
      summary: 'Séries do usuário',
      description:
        'Retorna todas as séries que o usuário acompanha (qualquer status de UserShowSubscription), com dados da série e status. Ordenado por atualização mais recente.',
    },
    responses: {
      200: 'Array de { status, show } ordenado por updatedAt desc.',
      401: 'Não autenticado.',
    },
  },
  getShowSubscriptionStatus: {
    operation: {
      summary: 'Status da assinatura de uma série',
      description:
        'Retorna o status atual da assinatura do usuário para a série informada, ou null se não houver assinatura.',
    },
    responses: {
      200: '{ status: ShowSubscriptionStatus | null }',
      401: 'Não autenticado.',
    },
  },
  upsertShowSubscription: {
    operation: {
      summary: 'Adicionar ou atualizar assinatura de série',
      description:
        'Cria ou atualiza o status de acompanhamento de uma série (WATCHING, REWATCHING, PAUSED, STOPPED, PLAN_TO_WATCH, NOT_WATCHING_FOR_A_WHILE).',
    },
    responses: {
      201: 'Assinatura criada ou atualizada.',
      401: 'Não autenticado.',
      404: 'Série não encontrada.',
    },
  },
  removeShowSubscription: {
    operation: {
      summary: 'Remover assinatura de série',
      description:
        'Remove completamente a assinatura do usuário para a série informada.',
    },
    responses: {
      200: 'Assinatura removida.',
      401: 'Não autenticado.',
      404: 'Assinatura não encontrada.',
    },
  },
} as const;
