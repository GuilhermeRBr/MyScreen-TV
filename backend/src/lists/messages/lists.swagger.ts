/**
 * Documentação Swagger do módulo Lists.
 */
export const LISTS_SWAGGER = {
  create: {
    operation: {
      summary: 'Criar lista',
      description: 'Cria uma nova lista personalizada para o usuário autenticado. O campo isPublic define a visibilidade.',
    },
    responses: {
      201: 'Lista criada com sucesso.',
      401: 'Não autenticado.',
    },
  },
  getMyLists: {
    operation: {
      summary: 'Minhas listas',
      description: 'Retorna todas as listas do usuário autenticado, com contagem de itens.',
    },
    responses: {
      200: 'Array de listas do usuário.',
      401: 'Não autenticado.',
    },
  },
  getById: {
    operation: {
      summary: 'Detalhes de uma lista',
      description:
        'Retorna uma lista com todos os seus itens (séries/filmes). O usuário precisa ser o dono ou a lista deve ser pública.',
    },
    responses: {
      200: 'Lista com seus itens.',
      403: 'Sem permissão para ver esta lista (lista privada de outro usuário).',
      404: 'Lista não encontrada.',
    },
  },
  addItem: {
    operation: {
      summary: 'Adicionar item à lista',
      description:
        'Adiciona uma série ou filme a uma lista existente do usuário. Forneça showId (UUID interno) ou movieId (UUID interno), nunca os dois ao mesmo tempo.',
    },
    responses: {
      201: 'Item adicionado com sucesso.',
      400: 'Nenhum showId ou movieId fornecido.',
      403: 'Sem permissão para modificar esta lista.',
      404: 'Lista não encontrada.',
    },
  },
  removeItem: {
    operation: {
      summary: 'Remover item da lista',
      description:
        'Remove um item de uma lista pelo UUID do item. O usuário precisa ser o dono da lista.',
    },
    responses: {
      200: 'Item removido com sucesso.',
      403: 'Sem permissão para modificar esta lista.',
      404: 'Lista ou item não encontrado.',
    },
  },
  deleteList: {
    operation: {
      summary: 'Excluir lista',
      description:
        'Remove permanentemente uma lista e todos os seus itens. O usuário precisa ser o dono da lista.',
    },
    responses: {
      200: 'Lista excluída com sucesso.',
      403: 'Sem permissão para excluir esta lista.',
      404: 'Lista não encontrada.',
    },
  },
} as const;
