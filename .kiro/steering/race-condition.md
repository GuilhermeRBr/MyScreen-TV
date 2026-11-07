# Regra: Prevenção de race condition em operações de banco de dados

## Contexto

`Promise.all` com operações de escrita no banco (upsert, create, update, delete) pode causar race condition quando os registros compartilham um unique constraint. O Prisma executa cada operação como um `SELECT + INSERT/UPDATE` não atômico — duas promessas concorrentes podem passar pelo `SELECT` (não encontrar o registro), tentar o `INSERT` ao mesmo tempo e uma delas falhar com `P2002` (Unique constraint failed).

## Regra

### Proibido

```ts
// ERRADO — race condition em (seasonId, episodeNumber)
await Promise.all(
  seasons.map((s) => upsertSeason(showId, s))
);
```

### Obrigatório para escrita com unique constraint

Sempre que um `Promise.all` executar **upserts, creates ou deletes** em registros que compartilham um unique constraint (composto ou simples), substituir por `for...of` sequencial:

```ts
// CORRETO — sequencial, sem colisão
for (const s of seasons) {
  await upsertSeason(showId, s);
}
```

### Quando `Promise.all` é seguro

`Promise.all` é aceitável apenas para:
- Operações exclusivamente de **leitura** (`findMany`, `count`, `findUnique`)
- Operações de **escrita em registros independentes** sem nenhum unique constraint compartilhado entre eles
- Geração de tokens ou operações que não tocam o banco (ex: `jwtService.signAsync`)

### Fallback para P2002 residual

Quando um upsert puder falhar com P2002 mesmo em execução sequencial (ex: o `tmdbId` de um episódio muda entre syncs), tratar o erro explicitamente:

```ts
try {
  await prisma.episode.upsert({ where: { tmdbId: ep.id }, ... });
} catch (err) {
  if (isP2002(err)) {
    await prisma.episode.updateMany({
      where: { seasonId, episodeNumber: ep.episode_number },
      data: { ... },
    });
  } else {
    throw err;
  }
}

function isP2002(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code: string }).code === 'P2002'
  );
}
```

## Casos já corrigidos neste projeto

| Arquivo | Operação | Motivo da correção |
|---|---|---|
| `tmdb.service.ts` | `upsertSeason` por série | Unique constraint `(seasonId, episodeNumber)` |
| `tmdb.service.ts` | `upsert` de elenco/showCast | Unique constraint em `cast.tmdbId` e `showCast.(showId, castId)` |

## Checklist antes de usar `Promise.all` com escrita

- [ ] Os registros escritos em paralelo compartilham algum unique constraint?
- [ ] Existe alguma dependência de resultado entre as promessas (ex: usar o `id` retornado de uma para criar outra)?
- [ ] O mesmo endpoint pode ser chamado concorrentemente por dois usuários?

Se qualquer resposta for "sim", use `for...of` sequencial.


---
inclusion: always
---

# Concurrency Control & Race Condition Prevention

## 1. Regra fundamental

A aplicação NUNCA deve apresentar inconsistências causadas por
operações concorrentes.

Toda funcionalidade deve ser projetada considerando que múltiplas
requisições podem acessar, modificar ou excluir os mesmos recursos
simultaneamente.

A integridade dos dados tem prioridade sobre a velocidade de execução.

É OBRIGATÓRIO identificar, prevenir e testar possíveis Race Conditions
antes de considerar qualquer implementação concluída.

## 2. Análise obrigatória

Antes de implementar ou modificar qualquer funcionalidade que envolva
persistência de dados, o agente DEVE:

- Identificar operações que podem acontecer simultaneamente.
- Identificar recursos compartilhados entre usuários.
- Identificar operações de leitura e escrita concorrentes.
- Verificar possíveis condições de Read-Modify-Write.
- Identificar operações que dependem de estados anteriores.
- Verificar operações de criação, atualização e exclusão simultâneas.
- Identificar possíveis duplicações de registros.
- Identificar inconsistências entre entidades relacionadas.

Nunca presumir que duas requisições serão executadas sequencialmente.

## 3. Controle de concorrência no banco de dados

Priorizar mecanismos de atomicidade e consistência no próprio banco
de dados.

Sempre avaliar a necessidade de:

- Transações de banco de dados.
- Operações atômicas.
- Constraints UNIQUE.
- Foreign Keys.
- Controle de integridade referencial.
- Optimistic Locking.
- Pessimistic Locking.
- Controle de versão de registros.
- Isolamento de transações adequado.

Não confiar exclusivamente em validações realizadas na aplicação.

Exemplo de implementação INCORRETA:

1. Consultar se um registro existe.
2. Se não existir, criar o registro.

Duas requisições simultâneas podem consultar antes da criação e
inserir registros duplicados.

A implementação deve garantir a unicidade diretamente no banco,
utilizando constraints e operações atômicas apropriadas.

## 4. Operações críticas

Identificar e proteger especialmente:

- Criação de registros.
- Atualização de registros.
- Exclusão de registros.
- Alterações de status.
- Cancelamentos.
- Finalizações.
- Aprovações e reprovações.
- Movimentações financeiras.
- Atualizações de saldo ou quantidade.
- Contadores e sequências.
- Relacionamentos entre entidades.
- Processamento de filas.
- Operações que geram histórico.

Toda operação que altera o estado de um recurso deve considerar
a possibilidade de execução concorrente.

## 5. Atualização de estado

Nunca utilizar uma estratégia insegura de leitura, modificação
e gravação quando existir possibilidade de concorrência.

Exemplo INCORRETO:

const item = await prisma.item.findUnique({ where: { id } });

item.quantity += 1;

await prisma.item.update({
  where: { id },
  data: { quantity: item.quantity }
});

Duas requisições podem ler o mesmo valor e sobrescrever
a atualização uma da outra.

Preferir operações atômicas:

await prisma.item.update({
  where: { id },
  data: {
    quantity: { increment: 1 }
  }
});

Adaptar a estratégia conforme as regras de negócio.

## 6. Transações

Quando uma operação envolver múltiplas alterações que precisam
ser consistentes, utilizar transações.

Exemplo:

- Atualizar o registro principal.
- Criar um registro de histórico.
- Atualizar entidades relacionadas.

Essas operações devem ser executadas atomicamente quando fizerem
parte da mesma unidade lógica de negócio.

Se uma etapa falhar, nenhuma alteração parcial deve permanecer.

Evitar transações excessivamente longas.

Não executar chamadas externas demoradas dentro de transações
sem necessidade.

## 7. Controle de concorrência distribuída

Considerar que a aplicação pode possuir múltiplas instâncias
executando simultaneamente.

Não utilizar variáveis globais, flags em memória ou locks locais
como mecanismo de garantia de integridade distribuída.

Quando necessário, avaliar:

- Locks distribuídos.
- Redis.
- Filas de processamento.
- Idempotência.
- Controle de concorrência no banco de dados.

A solução deve continuar funcionando mesmo quando existirem
múltiplas instâncias do backend.

## 8. Idempotência

Operações críticas devem avaliar a necessidade de idempotência.

Requisições repetidas não devem provocar efeitos duplicados
quando representam a mesma operação lógica.

Considerar:

- Idempotency Keys.
- Identificadores únicos de operação.
- Constraints no banco.
- Controle de processamento.
- Deduplicação de eventos.

## 9. Testes obrigatórios

Toda funcionalidade sujeita à concorrência deve possuir testes
que simulem requisições simultâneas.

Não considerar testes sequenciais suficientes para validar
segurança contra Race Conditions.

Criar cenários que envolvam:

- Duas requisições simultâneas.
- Dezenas de requisições simultâneas.
- Atualizações simultâneas do mesmo registro.
- Criações duplicadas.
- Exclusão e atualização simultâneas.
- Alterações concorrentes de status.
- Falhas durante transações.
- Repetição de requisições.
- Concorrência entre diferentes usuários.

Os testes devem verificar o estado final do banco de dados,
não apenas os códigos HTTP retornados.

## 10. Critérios de aprovação

Uma implementação NÃO pode ser considerada concluída se:

- Existir possibilidade conhecida de Race Condition.
- Existirem operações não atômicas sem proteção.
- Existirem inconsistências de dados sob concorrência.
- Existirem registros duplicados indevidos.
- Existirem atualizações perdidas.
- Existirem transições inválidas de estado.
- Existirem operações parcialmente concluídas.
- Os testes de concorrência apresentarem resultados inconsistentes.

Não ignorar problemas de concorrência por serem considerados
casos raros.

## 11. Revisão obrigatória

Ao finalizar qualquer implementação que modifique dados:

1. Revisar os pontos de concorrência.
2. Identificar possíveis interleavings entre requisições.
3. Verificar atomicidade das operações.
4. Verificar integridade do banco.
5. Executar testes concorrentes.
6. Corrigir todos os problemas encontrados.
7. Documentar mecanismos de proteção implementados.

Não adicionar locks, transações ou mecanismos complexos
sem necessidade comprovada.

Escolher sempre a solução mais simples que garanta
a integridade dos dados.