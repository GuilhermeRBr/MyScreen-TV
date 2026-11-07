/**
 * Documentação Swagger do módulo Movies.
 */
export const MOVIES_SWAGGER = {
  getPopular: {
    operation: {
      summary: 'Filmes populares',
      description: 'Retorna a lista de filmes populares via TMDB. Parâmetro opcional: page. Não requer autenticação.',
    },
    responses: { 200: 'Lista de filmes populares.' },
  },
  getTrending: {
    operation: {
      summary: 'Filmes em alta',
      description: 'Retorna os filmes em tendência da semana via TMDB. Não requer autenticação.',
    },
    responses: { 200: 'Lista de filmes em alta.' },
  },
  search: {
    operation: {
      summary: 'Buscar filmes',
      description: 'Pesquisa filmes pelo nome via TMDB. Parâmetro obrigatório: q. Não requer autenticação.',
    },
    responses: { 200: 'Resultados da busca.' },
  },
  getDetail: {
    operation: {
      summary: 'Detalhes de um filme',
      description:
        'Retorna detalhes completos de um filme pelo ID do TMDB. Sincroniza com o banco se necessário. Não requer autenticação.',
    },
    responses: {
      200: 'Detalhes do filme.',
      404: 'Filme não encontrado.',
    },
  },
  getFeed: {
    operation: {
      summary: 'Feed de filmes populares com trailers',
      description:
        'Retorna filmes populares paginados, cada um com trailerKey do YouTube (ou null). Usado no feed infinito da tela Explorar. Não requer autenticação.',
    },
    responses: { 200: 'Lista de filmes com trailerKey, page e total_pages.' },
  },
} as const;
