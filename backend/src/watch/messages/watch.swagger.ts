/**
 * Documentação Swagger do módulo Watch.
 */
export const WATCH_SWAGGER = {
  toggleEpisode: {
    operation: {
      summary: 'Marcar/desmarcar episódio como assistido',
      description:
        'Alterna o estado de assistido de um episódio. Se já foi assistido, remove o registro; caso contrário, marca como assistido.',
    },
    responses: {
      201: 'Estado alternado. Retorna o novo estado.',
      401: 'Não autenticado.',
      404: 'Episódio não encontrado.',
    },
  },
  markSeasonWatched: {
    operation: {
      summary: 'Marcar temporada inteira como assistida',
      description: 'Marca todos os episódios de uma temporada como assistidos.',
    },
    responses: {
      201: 'Todos os episódios marcados.',
      401: 'Não autenticado.',
      404: 'Temporada não encontrada.',
    },
  },
  getShowProgress: {
    operation: {
      summary: 'Progresso de uma série',
      description:
        'Retorna quantos episódios foram assistidos por temporada e o total geral.',
    },
    responses: {
      200: 'Progresso por temporada.',
      401: 'Não autenticado.',
    },
  },
  toggleMovie: {
    operation: {
      summary: 'Marcar/desmarcar filme como assistido',
      description: 'Alterna o estado de assistido de um filme.',
    },
    responses: {
      201: 'Estado alternado.',
      401: 'Não autenticado.',
      404: 'Filme não encontrado.',
    },
  },
  addToWatchlist: {
    operation: {
      summary: 'Adicionar filme à watchlist',
      description: "Adiciona um filme à lista \"quero assistir\" do usuário.",
    },
    responses: {
      201: 'Filme adicionado à watchlist.',
      401: 'Não autenticado.',
    },
  },
  getStats: {
    operation: {
      summary: 'Estatísticas do usuário',
      description:
        'Retorna episódios assistidos, tempo total de TV e filmes assistidos.',
    },
    responses: {
      200: 'Estatísticas de consumo.',
      401: 'Não autenticado.',
    },
  },
} as const;
