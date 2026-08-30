---
title: Boas Práticas de Programação
inclusion: always
---

# Boas Práticas de Programação

Este steering se aplica a todo código gerado no projeto (frontend Next.js e backend NestJS). Sempre priorize estas regras sobre estilo pessoal ou "jeito mais rápido" de resolver.

## Princípios gerais

- **SOLID** — principalmente Single Responsibility (uma classe/função faz uma coisa) e Dependency Inversion (dependa de interfaces/abstrações, não de implementações concretas, especialmente em Services do Nest).
- **DRY** — mas sem forçar abstração prematura; duplicar 2x é aceitável, na 3ª vez extrai.
- **KISS / YAGNI** — não adicionar configuração, camada ou generalização para um caso de uso que não existe ainda.
- **Fail fast** — validar entradas o quanto antes (DTOs no Nest, schemas no frontend) em vez de deixar erro estourar depois no meio da lógica.
- Nomes de variáveis, funções e arquivos sempre em **inglês**; textos/labels visíveis ao usuário em **português**.

## TypeScript

- `strict: true` sempre ligado no `tsconfig.json` (frontend e backend). Nunca desativar regras de strict pra "fazer funcionar".
- Proibido `any` — usar `unknown` + type guard, ou tipar corretamente. Se for inevitável, comentar o motivo.
- Preferir `type` para uniões/composições e `interface` para contratos de objetos/DTOs que podem ser estendidos.
- Nada de `// @ts-ignore` sem um comentário explicando por que é seguro ali.
- Funções pequenas (até ~30 linhas como referência) e com poucos parâmetros — a partir de 3 parâmetros, usar um objeto de opções tipado.

## Backend (NestJS)

- **Controller fino**: só recebe request, valida via DTO e chama o Service. Nenhuma regra de negócio no Controller.
- **DTOs com `class-validator`** para toda entrada (`@IsString()`, `@IsUUID()`, `@IsOptional()`, etc.) — é o que o `ValidationPipe` global já exige.
- **Service não conhece o HTTP** — não deve lançar `HttpException` direto sempre; prefira exceptions de domínio capturadas pelo `ExceptionFilter` global, ou `NotFoundException`/`ForbiddenException` do Nest quando fizer sentido.
- Um módulo por domínio (`ShowsModule`, `MoviesModule`, `WatchModule`...), nunca um `AppModule` gigante com tudo dentro.
- Toda query ao banco passa pelo Prisma Client (nunca `$queryRawUnsafe` com valor vindo do usuário).
- Repetição de acesso a dados em mais de um Service → extrair para um Repository/Provider dedicado, não copiar a query.

## Frontend (Next.js + CSS Modules)

- Preferir **Server Components** por padrão; só usar `"use client"` quando precisar de estado, efeito ou evento do navegador.
- Um componente = uma responsabilidade visual. Se o JSX passar de ~150 linhas ou tiver muitos `if`, quebrar em subcomponentes.
- CSS Modules: nome de classe em `camelCase` (`styles.posterCard`, não `styles.poster-card`), um arquivo `Componente.module.css` por componente, nada de estilo inline exceto valor dinâmico calculado em runtime.
- Nenhuma chamada de API direto dentro do componente visual — sempre via `lib/api.ts` ou um hook customizado (`useShowDetails`, `useWatchProgress`).
- Nunca guardar token ou dado sensível em `localStorage`/`sessionStorage` (já coberto no steering de arquitetura, mas vale reforçar aqui).

## Prisma

- Nunca editar `schema.prisma` e esquecer de rodar `yarn prisma migrate dev` — schema e migration andam juntos no mesmo commit.
- Nomes de model em `PascalCase` singular (`Show`, não `Shows`); nomes de campo em `camelCase`.
- Selects explícitos (`select`/`include`) nas queries que alimentam a API — nunca devolver o model inteiro do Prisma direto na resposta HTTP sem passar por um DTO/mapper (evita vazar campo sensível sem querer).

## Tratamento de erros

- Nunca engolir erro com `catch {}` vazio — logar (via logger estruturado) e decidir explicitamente: relançar, converter em exceção de domínio, ou retornar fallback.
- Mensagens de erro para o usuário final são genéricas e amigáveis; detalhes técnicos só vão para o log (nunca na resposta HTTP, conforme o `ExceptionFilter` global).

## Testes

- Toda regra de negócio nova em um Service do Nest ganha teste unitário (Jest) cobrindo o caminho feliz e pelo menos um caminho de erro.
- Testes de integração para os endpoints críticos (auth, watch progress) usando um banco de teste isolado, nunca o banco de dev/produção.
- Não commitar código com teste quebrado ou `.only`/`.skip` esquecido.

## Git e commits

- Conventional Commits: `feat:`, `fix:`, `refactor:`, `chore:`, `test:`, `docs:` — mensagem no imperativo e em português é aceitável, mas o prefixo sempre em inglês.
- Um commit = uma mudança lógica. Evitar commit "ajustes gerais" misturando features não relacionadas.
- PR pequeno o suficiente pra revisar em uma sentada; se estiver grande, considerar quebrar em etapas.

## Checklist rápido antes de considerar algo "pronto"

- [ ] Sem `any`, sem `@ts-ignore` não justificado
- [ ] DTO validando toda entrada nova de endpoint
- [ ] Sem lógica de negócio em Controller/Componente visual
- [ ] Erros tratados explicitamente, nunca engolidos
- [ ] Teste cobrindo a regra nova
- [ ] Lint e format passando (hook de save já cobre isso)
- [ ] Nenhum dado sensível logado ou devolvido sem necessidade