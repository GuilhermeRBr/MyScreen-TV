---
inclusion: always
---
<!------------------------------------------------------------------------------------
   Add rules to this file or a short description and have Kiro refine them for you.
   
   Learn about inclusion modes: https://kiro.dev/docs/steering/#inclusion-modes
-------------------------------------------------------------------------------------> ---
inclusion: always
---

# Code Quality & Dead Code Prevention

## 1. Regra fundamental

A aplicação deve manter uma base de código limpa, enxuta,
organizada e livre de código morto.

É PROIBIDO manter código desnecessário, obsoleto ou sem utilização
sem uma justificativa técnica clara.

Toda implementação deve considerar não apenas a adição de código,
mas também a remoção e manutenção do código existente.

## 2. Código morto

Identificar e remover:

- Funções nunca utilizadas.
- Métodos sem referências.
- Classes sem utilização.
- Variáveis declaradas e nunca utilizadas.
- Imports desnecessários.
- Componentes sem utilização.
- Hooks sem utilização.
- Services obsoletos.
- Controllers sem rotas ou referências.
- DTOs abandonados.
- Interfaces e Types sem utilização.
- Constantes desnecessárias.
- Arquivos duplicados.
- Implementações antigas substituídas.
- Código comentado que não possui finalidade.
- Blocos de código inalcançáveis.
- Condições impossíveis ou redundantes.

Não manter implementações antigas apenas por precaução.

## 3. Alterações e refatorações

Sempre que modificar uma funcionalidade:

1. Analisar os arquivos envolvidos.
2. Identificar implementações anteriores que perderam sua finalidade.
3. Verificar referências e dependências.
4. Remover código substituído.
5. Atualizar imports e dependências.
6. Eliminar duplicações introduzidas.
7. Verificar se outros módulos dependem da implementação antiga.

Não adicionar uma nova implementação sem avaliar
se existe alguma implementação anterior que possa ser reutilizada,
corrigida ou substituída.

## 4. Código comentado

Não utilizar comentários para armazenar código antigo.

Exemplo proibido:

// const oldFunction = () => {
//   ...
// };

Se o código não é mais necessário, removê-lo.

Comentários devem explicar decisões, regras de negócio
ou comportamentos que não sejam evidentes.

## 5. Duplicação de código

Evitar:

- Funções com a mesma finalidade.
- Regras de negócio duplicadas.
- Validações repetidas.
- Consultas equivalentes implementadas em vários lugares.
- Componentes visualmente idênticos sem necessidade.
- Services que executam operações redundantes.

Priorizar reutilização sem criar abstrações desnecessárias.

Não transformar pequenas funções independentes em abstrações
complexas apenas para reduzir algumas linhas de código.

## 6. Dependências

Manter as dependências do projeto sob controle.

- Identificar pacotes não utilizados.
- Remover dependências desnecessárias.
- Evitar instalar bibliotecas para funcionalidades simples
  que já podem ser implementadas com recursos existentes.
- Não manter bibliotecas antigas após substituição.
- Verificar dependências transitivas quando necessário.

Nunca remover uma dependência sem verificar seu uso
em scripts, configurações e processos de build.

## 7. Organização da arquitetura

Respeitar a arquitetura existente.

- Não criar arquivos desnecessários.
- Não duplicar módulos existentes.
- Não criar services redundantes.
- Não manter implementações alternativas sem justificativa.
- Evitar arquivos excessivamente grandes.
- Evitar responsabilidades misturadas.
- Manter separação adequada entre regras de negócio,
  persistência e apresentação.

## 8. Remoção segura

Antes de excluir qualquer código:

1. Pesquisar todas as referências.
2. Verificar imports dinâmicos.
3. Verificar dependências indiretas.
4. Verificar rotas e endpoints.
5. Verificar referências em configurações.
6. Verificar utilização em testes.
7. Verificar utilização em scripts e tarefas agendadas.

Não remover código apenas porque não existem referências
diretas e estáticas.

Considerar também funcionalidades acessadas dinamicamente.

## 9. Verificações obrigatórias

Após alterações significativas, executar:

- TypeScript typecheck.
- ESLint.
- Build da aplicação.
- Testes automatizados.
- Verificação de imports não utilizados.
- Análise de dependências não utilizadas.

Corrigir problemas introduzidos pela implementação.

Não desabilitar regras do ESLint apenas para fazer
o código passar na validação.

## 10. Proibições

É proibido:

- Criar funções duplicadas para contornar problemas existentes.
- Manter código antigo após substituição.
- Criar arquivos temporários sem removê-los.
- Ignorar imports não utilizados.
- Desabilitar verificações de qualidade sem justificativa.
- Manter código comentado como backup.
- Criar abstrações desnecessárias.
- Deixar TODOs sem justificativa ou contexto.
- Ignorar warnings introduzidos pela implementação.

## 11. Critério de conclusão

Uma implementação só pode ser considerada concluída quando:

- O código novo estiver integrado à arquitetura.
- O código obsoleto relacionado tiver sido removido.
- Não existirem imports desnecessários.
- Não existirem duplicações evitáveis.
- Não existirem erros de tipagem.
- Não existirem warnings novos injustificados.
- Build e testes estiverem funcionando.

## 12. Princípio final

O objetivo não é escrever menos código a qualquer custo.

O objetivo é manter somente o código que possui uma finalidade
real dentro da aplicação.

Toda alteração deve melhorar ou preservar a qualidade
da base de código.

Priorizar simplicidade, legibilidade, manutenção e
responsabilidade única.