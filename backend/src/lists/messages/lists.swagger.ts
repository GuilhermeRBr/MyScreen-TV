/**
 * Documentação Swagger do módulo Lists.
 */
export const LISTS_SWAGGER = {
  create: {
    operation: {
      summary: 'Criar lista',
      description: 'Cria uma nova lista personalizada para o usuário.',
    },
    responses: {
      201: 'Lista criada.',
      401: 'Não autenticado.',
    },
  },
  getMyLists: {
    operation: {
      summary: 'Minhas listas',
      description: 'Retorna todas as listas do usuário autenticado.',
    },
    responses: {
      200: 'Lista de listas.',
      401: 'Não autenticado.',
    },
  },
  getById: {
    operation: {
      summary: 'Detalhes de uma lista',
      description:
        'Retorna os itens de uma lista específica. O usuário precisa ser o dono ou a lista deve ser pública.',
    },
    responses: {
      200: 'Lista com seus itens.',
      403: 'Sem permissão para ver esta lista.',
      404: 'Lista não encontrada.',
    },
  },
  addItem: {
    operation: {
      summary: 'Adicionar item à lista',
      description:
        'Adiciona uma série ou filme a uma lista. Forneça showId ou movieId.',
    },
    responses: {
      201: 'Item adicionado.',
      400: 'Nenhum showId ou movieId fornecido.',
      403: 'Sem permissão.',
      404: 'Lista não encontrada.',
    },
  },
  removeItem: {
    operation: { summary: 'Remover item da lista' },
    responses: {
      200: 'Item removido.',
      403: 'Sem permissão.',
      404: 'Lista ou item não encontrado.',
    },
  },
  deleteList: {
    operation: { summary: 'Excluir lista' },
    responses: {
      200: 'Lista excluída.',
      403: 'Sem permissão.',
      404: 'Lista não encontrada.',
    },
  },
} as const;
