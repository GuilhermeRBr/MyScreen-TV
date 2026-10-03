# Steering — Arquitetura do Projeto: Catálogo de Séries e Filmes

## Contexto do produto

Aplicação de catalogação de séries e filmes (referência visual: apps estilo MyScreen TV), permitindo ao usuário: seguir séries/filmes, marcar episódios como assistidos, ver progresso por temporada, listas customizadas, "continuar assistindo", "em breve" (calendário de lançamentos) e perfil com estatísticas.

## Stack definida

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js (App Router) |
| Estilização | CSS Modules |
| Backend | NestJS |
| ORM | Prisma |
| Banco de dados | PostgreSQL |
| Gerenciador de pacotes | Yarn |

Todas as decisões abaixo assumem essa stack — não usar Tailwind, TypeORM/Drizzle, npm/pnpm ou outras alternativas a menos que este documento seja atualizado.

---

## Fase 1 — Banco de dados (PostgreSQL)

- [ ] Subir a instância via Docker Compose (dev) e via serviço gerenciado tipo Neon/Supabase/RDS (staging/produção).
- [ ] Nunca usar o usuário `postgres` (superuser) na aplicação. Criar um usuário dedicado com permissões restritas (SELECT/INSERT/UPDATE/DELETE) apenas nos schemas necessários.
- [ ] Exigir SSL na connection string (`sslmode=require`) em staging/produção.
- [ ] Definir pool de conexões (via `datasource` do Prisma / PgBouncer) com limite máximo de conexões simultâneas, evitando exaustão.

## Fase 2 — Backend (NestJS + Prisma)

- [ ] Gerar o projeto: `yarn dlx @nestjs/cli new backend` (usando Yarn como package manager).
- [ ] Instalar `@nestjs/config` e validar `.env` no startup com `zod` (schema de env obrigatório antes do boot).
- [ ] `.gitignore` cobrindo `.env`, `.env.*.local` desde o primeiro commit.
- [ ] Configurar Prisma:
  - `yarn add prisma @prisma/client`
  - `yarn prisma init`
  - Todas as queries via Prisma Client (evita SQL Injection por padrão — nunca usar `$queryRawUnsafe` com input não sanitizado).
- [ ] `ValidationPipe` global no `main.ts`:
  ```ts
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  ```
- [ ] `helmet` aplicado globalmente (HSTS, X-Frame-Options, X-Content-Type-Options).
- [ ] `@nestjs/throttler` configurado globalmente (rate limiting por IP).
- [ ] CORS restrito à URL exata do frontend Next.js (nunca `origin: '*'` em produção).
- [ ] `ExceptionFilter` global customizado — nunca deixar stack trace ou erro bruto do Postgres vazar na resposta HTTP.
- [ ] Autenticação: Passport JWT (RS256 ou HS256 com segredo longo) + Guards/`@SetMetadata()` para RBAC (papéis: usuário comum, admin/moderador de conteúdo).

### Módulos sugeridos (Nest)
```
/src
  /auth        (login, refresh, guards, strategies)
  /users       (perfil, stats, follows)
  /shows       (séries, temporadas, episódios)
  /movies      (filmes)
  /watch       (progresso de episódios/filmes)
  /lists       (listas customizadas do usuário)
  /feed        (explorar/descobrir)
  /prisma      (PrismaService compartilhado)
```

## Fase 3 — Frontend (Next.js)

- [ ] Gerar o projeto: `yarn create next-app frontend` (App Router, TypeScript; **sem** Tailwind — estilização via CSS Modules).
- [ ] Separar variáveis: apenas o estritamente necessário no client vai com `NEXT_PUBLIC_`. Tokens de API, chaves privadas e URLs internas do banco nunca em `NEXT_PUBLIC_`.
- [ ] Access/Refresh tokens em cookies `HttpOnly`, `Secure`, `SameSite=Strict` (nunca em `localStorage`).
- [ ] CSP configurada via `next.config.js`/middleware para bloquear scripts não autorizados (mitigação de XSS).
- [ ] `middleware.ts` validando token nos cookies antes de renderizar rotas protegidas (ex: `/perfil`, `/minha-lista`).
- [ ] Cliente HTTP único (`/lib/api.ts`) com interceptador de refresh automático de token e envio seguro de credenciais.

### Estrutura sugerida (Next.js + CSS Modules)
```
/app
  /(tabs)/series/page.tsx
  /(tabs)/filmes/page.tsx
  /(tabs)/explorar/page.tsx
  /(tabs)/perfil/page.tsx
  /show/[id]/sobre/page.tsx
  /show/[id]/episodios/page.tsx
/components
  /PosterCard/PosterCard.tsx + PosterCard.module.css
  /EpisodeListItem/...
  /BottomNav/...
/lib/api.ts
/middleware.ts
```

## Fase 4 — Infra, CI/CD e Observabilidade

- [ ] ESLint + Prettier + Husky + lint-staged (bloquear commit de código fora do padrão).
- [ ] `yarn audit` (ou Snyk/Dependabot) no fluxo de checagem de dependências vulneráveis.
- [ ] Pipeline de CI/CD (GitHub Actions): testes automatizados, type-check, lint, build de containers Docker.
- [ ] Segredos de ambiente injetados via Secret Manager da plataforma de CI/CD — nunca hardcoded no repositório.
- [ ] Logger estruturado no NestJS (`pino` ou `winston`) com sanitização/mascaramento de senhas, tokens e PII antes de qualquer log.

---

## Modelo de dados (referência — Prisma schema, alto nível)

```
User, Follow
Show, Season, Episode, Cast, ShowCast
Movie
WatchProgress (episódios assistidos)
MovieWatch (filmes assistidos / watchlist)
UserShowSubscription (status: assistindo, revendo, parado, sem assistir há algum tempo)
CustomList, CustomListItem
Comment
Notification
```

`WatchProgress` é a entidade central: alimenta "continuar assistindo", contadores de temporada (X/Y) e estatísticas do perfil (tempo total assistido, episódios assistidos).