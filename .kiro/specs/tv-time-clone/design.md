# Design Document

## Overview

Aplicacao de catalogacao de series e filmes estilo TV Time, composta por um monorepo com dois projetos independentes: `backend` (NestJS + Prisma + PostgreSQL) e `frontend` (Next.js App Router + CSS Modules). A fonte primaria de dados de catalogo e a TMDB API, com cache local de ate 6 meses no PostgreSQL. Toda a comunicacao entre frontend e backend ocorre via HTTP REST, com autenticacao por cookies HttpOnly.

---

## Architecture

### Visao Geral do Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                        Cliente (Browser)                     │
│              Next.js App Router + CSS Modules                │
│         /app  /components  /lib/api.ts  middleware.ts        │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP REST (cookies HttpOnly)
┌──────────────────────▼──────────────────────────────────────┐
│                    Backend (NestJS)                          │
│  AuthModule  ShowsModule  MoviesModule  WatchModule          │
│  ListsModule  FeedModule  UsersModule  TmdbModule            │
│  PrismaModule  (helmet, throttler, ValidationPipe)           │
└──────────────────────┬──────────────────────────────────────┘
          ┌────────────┴────────────┐
          │                         │
┌─────────▼──────────┐   ┌─────────▼──────────┐
│   PostgreSQL        │   │    TMDB API         │
│   (Docker Compose)  │   │  (externa, cache    │
│   Prisma ORM        │   │   max 6 meses)      │
└────────────────────┘   └────────────────────┘
```

### Fluxo de Autenticacao

```
Cliente                    Backend                  PostgreSQL
  │                           │                         │
  │  POST /auth/login          │                         │
  │  {email, password}        │                         │
  │──────────────────────────>│                         │
  │                           │  SELECT user WHERE      │
  │                           │  email = ?              │
  │                           │────────────────────────>│
  │                           │<────────────────────────│
  │                           │  bcrypt.compare()       │
  │                           │  jwt.sign(accessToken)  │
  │                           │  jwt.sign(refreshToken) │
  │  Set-Cookie: access_token │                         │
  │  Set-Cookie: refresh_token│                         │
  │<──────────────────────────│                         │
  │                           │                         │
  │  POST /auth/refresh        │                         │
  │  (cookie: refresh_token)  │                         │
  │──────────────────────────>│                         │
  │                           │  jwt.verify(refresh)    │
  │                           │  jwt.sign(newAccess)    │
  │  Set-Cookie: access_token │                         │
  │<──────────────────────────│                         │
```

### Fluxo de Cache TMDB

```
Backend (ShowsService)         TmdbService            PostgreSQL
       │                           │                       │
       │  getShow(tmdbId)           │                       │
       │──────────────────────────>│                       │
       │                           │  findUnique(tmdbId)   │
       │                           │──────────────────────>│
       │                           │<──────────────────────│
       │                           │                       │
       │   [cache miss]            │                       │
       │                           │  GET /tv/:tmdbId      │
       │                           │──────> TMDB API       │
       │                           │<────── response       │
       │                           │  upsert(show,         │
       │                           │    syncedAt: now())   │
       │                           │──────────────────────>│
       │                           │<──────────────────────│
       │<──────────────────────────│                       │
       │                           │                       │
       │   [cache hit, < 6 meses]  │                       │
       │                           │  return cached data   │
       │<──────────────────────────│                       │
```

---

## Data Models

### Schema Prisma Completo

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── Enums ───────────────────────────────────────────────────

enum Role {
  user
  admin
}

enum SubscriptionStatus {
  assistindo
  revendo
  parado
  sem_assistir_ha_algum_tempo
}

enum NotificationType {
  new_episode
  new_follower
  new_comment
}

// ─── User e Social ───────────────────────────────────────────

model User {
  id             String   @id @default(uuid())
  email          String   @unique
  username       String   @unique @db.VarChar(30)
  passwordHash   String
  role           Role     @default(user)
  avatarUrl      String?
  coverUrl       String?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  // relacoes
  subscriptions  UserShowSubscription[]
  watchProgress  WatchProgress[]
  movieWatches   MovieWatch[]
  lists          CustomList[]
  comments       Comment[]
  notifications  Notification[]
  following      Follow[]  @relation("follower")
  followers      Follow[]  @relation("following")
}

model Follow {
  id          String   @id @default(uuid())
  followerId  String
  followingId String
  createdAt   DateTime @default(now())

  follower    User @relation("follower",  fields: [followerId],  references: [id], onDelete: Cascade)
  following   User @relation("following", fields: [followingId], references: [id], onDelete: Cascade)

  @@unique([followerId, followingId])
}

// ─── Catalogo: Shows ─────────────────────────────────────────

model Show {
  id             String    @id @default(uuid())
  tmdbId         Int       @unique
  title          String
  originalTitle  String?
  overview       String?
  posterPath     String?
  backdropPath   String?
  genres         String[]
  networks       String[]
  status         String?   // "Ended", "Returning Series", etc.
  firstAirDate   DateTime?
  lastAirDate    DateTime?
  episodeRuntime Int?      // minutos
  voteAverage    Float?
  popularity     Float?
  syncedAt       DateTime?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  seasons        Season[]
  cast           ShowCast[]
  subscriptions  UserShowSubscription[]
  listItems      CustomListItem[]
  comments       Comment[]
}

model Season {
  id           String    @id @default(uuid())
  tmdbId       Int       @unique
  showId       String
  seasonNumber Int
  name         String?
  overview     String?
  posterPath   String?
  airDate      DateTime?
  syncedAt     DateTime?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  show         Show      @relation(fields: [showId], references: [id], onDelete: Cascade)
  episodes     Episode[]

  @@unique([showId, seasonNumber])
}

model Episode {
  id             String    @id @default(uuid())
  tmdbId         Int       @unique
  seasonId       String
  episodeNumber  Int
  name           String?
  overview       String?
  stillPath      String?
  airDate        DateTime?
  runtime        Int?      // minutos
  voteAverage    Float?
  syncedAt       DateTime?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  season         Season    @relation(fields: [seasonId], references: [id], onDelete: Cascade)
  watchProgress  WatchProgress[]

  @@unique([seasonId, episodeNumber])
}

// ─── Catalogo: Cast ──────────────────────────────────────────

model Cast {
  id          String  @id @default(uuid())
  tmdbId      Int     @unique
  name        String
  profilePath String?

  showCredits ShowCast[]
}

model ShowCast {
  id          String @id @default(uuid())
  showId      String
  castId      String
  character   String?
  order       Int?

  show        Show @relation(fields: [showId], references: [id], onDelete: Cascade)
  cast        Cast @relation(fields: [castId], references: [id], onDelete: Cascade)

  @@unique([showId, castId])
}

// ─── Catalogo: Movies ────────────────────────────────────────

model Movie {
  id            String    @id @default(uuid())
  tmdbId        Int       @unique
  title         String
  originalTitle String?
  overview      String?
  posterPath    String?
  backdropPath  String?
  genres        String[]
  releaseDate   DateTime?
  runtime       Int?      // minutos
  voteAverage   Float?
  popularity    Float?
  syncedAt      DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  watches       MovieWatch[]
  listItems     CustomListItem[]
  comments      Comment[]
}

// ─── Progresso do Usuario ────────────────────────────────────

model WatchProgress {
  id        String   @id @default(uuid())
  userId    String
  episodeId String
  watchedAt DateTime @default(now())

  user      User    @relation(fields: [userId],    references: [id], onDelete: Cascade)
  episode   Episode @relation(fields: [episodeId], references: [id], onDelete: Cascade)

  @@unique([userId, episodeId])
}

model MovieWatch {
  id          String   @id @default(uuid())
  userId      String
  movieId     String
  watchedAt   DateTime?
  onWatchlist Boolean  @default(false)
  createdAt   DateTime @default(now())

  user        User  @relation(fields: [userId],  references: [id], onDelete: Cascade)
  movie       Movie @relation(fields: [movieId], references: [id], onDelete: Cascade)

  @@unique([userId, movieId])
}

model UserShowSubscription {
  id        String             @id @default(uuid())
  userId    String
  showId    String
  status    SubscriptionStatus
  createdAt DateTime           @default(now())
  updatedAt DateTime           @updatedAt

  user      User @relation(fields: [userId], references: [id], onDelete: Cascade)
  show      Show @relation(fields: [showId], references: [id], onDelete: Cascade)

  @@unique([userId, showId])
}

// ─── Listas Customizadas ─────────────────────────────────────

model CustomList {
  id          String   @id @default(uuid())
  userId      String
  name        String   @db.VarChar(100)
  description String?
  coverUrl    String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user        User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  items       CustomListItem[]
}

model CustomListItem {
  id         String   @id @default(uuid())
  listId     String
  showId     String?
  movieId    String?
  addedAt    DateTime @default(now())

  list       CustomList @relation(fields: [listId],   references: [id], onDelete: Cascade)
  show       Show?      @relation(fields: [showId],   references: [id], onDelete: SetNull)
  movie      Movie?     @relation(fields: [movieId],  references: [id], onDelete: SetNull)
}

// ─── Social: Comentarios e Notificacoes ──────────────────────

model Comment {
  id        String   @id @default(uuid())
  userId    String
  showId    String?
  movieId   String?
  content   String   @db.Text
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user      User   @relation(fields: [userId],  references: [id], onDelete: Cascade)
  show      Show?  @relation(fields: [showId],  references: [id], onDelete: Cascade)
  movie     Movie? @relation(fields: [movieId], references: [id], onDelete: Cascade)
}

model Notification {
  id         String           @id @default(uuid())
  userId     String
  type       NotificationType
  referenceId String?         // episodeId, followerId, etc.
  read       Boolean          @default(false)
  createdAt  DateTime         @default(now())

  user       User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

---

## Components and Interfaces

### Backend: Estrutura de Modulos

```
backend/src/
  app.module.ts
  main.ts
  /auth/
    auth.module.ts
    auth.controller.ts
    auth.service.ts
    dto/
      login.dto.ts
      register.dto.ts
    strategies/
      jwt.strategy.ts
      jwt-refresh.strategy.ts
    guards/
      jwt-auth.guard.ts
      roles.guard.ts
    decorators/
      roles.decorator.ts
      current-user.decorator.ts
  /users/
    users.module.ts
    users.controller.ts
    users.service.ts
    dto/
      update-profile.dto.ts
  /shows/
    shows.module.ts
    shows.controller.ts
    shows.service.ts
    dto/
      subscribe.dto.ts
  /movies/
    movies.module.ts
    movies.controller.ts
    movies.service.ts
  /watch/
    watch.module.ts
    watch.controller.ts
    watch.service.ts
  /lists/
    lists.module.ts
    lists.controller.ts
    lists.service.ts
    dto/
      create-list.dto.ts
      add-list-item.dto.ts
  /feed/
    feed.module.ts
    feed.controller.ts
    feed.service.ts
  /tmdb/
    tmdb.module.ts
    tmdb.service.ts
    tmdb-sync.service.ts
    tmdb.types.ts
  /prisma/
    prisma.module.ts
    prisma.service.ts
  /common/
    filters/
      http-exception.filter.ts
    interceptors/
      logging.interceptor.ts
    pipes/
      (ValidationPipe via NestJS global)
    config/
      env.schema.ts   (zod schema de variaveis de ambiente)
```

### Backend: Interfaces Principais

```typescript
// Resposta padrao de erro (ExceptionFilter)
interface ErrorResponse {
  statusCode: number;
  message: string;
  requestId: string;
  timestamp: string;
}

// Resposta de autenticacao (sem expor tokens no body)
interface AuthResponse {
  user: {
    id: string;
    username: string;
    email: string;
    role: 'user' | 'admin';
    avatarUrl: string | null;
  };
}

// Payload do JWT
interface JwtPayload {
  sub: string;   // userId
  email: string;
  role: 'user' | 'admin';
  iat: number;
  exp: number;
}

// Progresso de Show para o usuario
interface ShowProgressDto {
  showId: string;
  tmdbId: number;
  title: string;
  posterPath: string | null;
  subscriptionStatus: SubscriptionStatus;
  totalEpisodes: number;
  watchedEpisodes: number;
  progressPercent: number;
  nextEpisode: NextEpisodeDto | null;
  seasons: SeasonProgressDto[];
}

interface SeasonProgressDto {
  seasonId: string;
  seasonNumber: number;
  totalEpisodes: number;
  watchedEpisodes: number;
  progressPercent: number;
}

interface NextEpisodeDto {
  episodeId: string;
  seasonNumber: number;
  episodeNumber: number;
  name: string | null;
  stillPath: string | null;
}

// Calendario Em Breve
interface UpcomingGroup {
  label: string;  // "HOJE", "AMANHA", "ONTEM", "SEXTA-FEIRA", "12 DE JUL. DE 2026"
  date: string;   // ISO date string
  items: UpcomingItem[];
}

interface UpcomingItem {
  type: 'episode' | 'movie';
  id: string;
  showTitle?: string;
  showId?: string;
  movieTitle?: string;
  movieId?: string;
  seasonNumber?: number;
  episodeNumber?: number;
  name: string | null;
  posterPath: string | null;
  airDate: string;
  platform?: string;
  airTime?: string;
  isNew: boolean;       // lancado nas ultimas 24h
  daysUntil: number;    // negativo se passou, 0 se hoje
}
```

### Frontend: Estrutura de Pastas

```
frontend/
  app/
    layout.tsx                    (layout raiz com BottomNav)
    page.tsx                      (redireciona para /series)
    (tabs)/
      series/
        page.tsx                  (tela principal de series)
      filmes/
        page.tsx                  (tela principal de filmes)
      explorar/
        page.tsx                  (feed + descobrir)
      perfil/
        page.tsx                  (perfil + estatisticas)
    minha-lista/
      page.tsx                    (minha lista + em breve)
    show/
      [id]/
        layout.tsx                (layout com header + abas)
        sobre/
          page.tsx                (aba sobre)
        episodios/
          page.tsx                (aba episodios)
    login/
      page.tsx
    register/
      page.tsx
  components/
    icons/
      IconCheck.tsx
      IconStar.tsx
      IconPlay.tsx
      IconChevronDown.tsx
      IconClock.tsx
      IconClapperboard.tsx
      IconBell.tsx
      IconGrid.tsx
      IconList.tsx
      IconSearch.tsx
      IconPlatformDisney.tsx
      IconPlatformAppleTV.tsx
      IconPlatformATX.tsx
      IconUser.tsx
      IconFilm.tsx
      IconTV.tsx
      IconCompass.tsx
      index.ts                    (re-exporta todos os icones)
    BottomNav/
      BottomNav.tsx
      BottomNav.module.css
    PosterCard/
      PosterCard.tsx
      PosterCard.module.css
    ProgressBar/
      ProgressBar.tsx
      ProgressBar.module.css
    EpisodeListItem/
      EpisodeListItem.tsx
      EpisodeListItem.module.css
    SeasonAccordion/
      SeasonAccordion.tsx
      SeasonAccordion.module.css
    UpcomingItem/
      UpcomingItem.tsx
      UpcomingItem.module.css
    FeedCard/
      FeedCard.tsx
      FeedCard.module.css
    ProfileHeader/
      ProfileHeader.tsx
      ProfileHeader.module.css
    StatCard/
      StatCard.tsx
      StatCard.module.css
    TabBar/
      TabBar.tsx
      TabBar.module.css
    Badge/
      Badge.tsx
      Badge.module.css
  lib/
    api.ts                        (cliente HTTP com refresh interceptor)
    tmdb-image.ts                 (helper para construir URLs de imagem TMDB)
    date-labels.ts                (helper para rotulos de data do calendario)
    format-duration.ts            (helper: minutos -> "X meses Y dias Z horas")
  middleware.ts
  styles/
    globals.css                   (variaveis CSS de tema + reset)
  next.config.js
  tsconfig.json
```

### Frontend: Variaveis CSS de Tema

```css
/* styles/globals.css */
:root {
  /* cores base */
  --color-bg:          #0d0d0d;
  --color-surface:     #1a1a1a;
  --color-surface-alt: #242424;
  --color-border:      #2e2e2e;

  /* texto */
  --color-text-primary:   #ffffff;
  --color-text-secondary: #a0a0a0;
  --color-text-muted:     #606060;

  /* accent */
  --color-accent:          #f5c518;   /* amarelo */
  --color-accent-hover:    #e6b800;

  /* progresso */
  --color-progress-green:  #4caf50;
  --color-progress-yellow: #f5c518;
  --color-progress-purple: #9c27b0;

  /* badges */
  --color-badge-new:       #f5c518;
  --color-badge-premiere:  #2196f3;

  /* tipografia */
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-size-xs:  0.75rem;
  --font-size-sm:  0.875rem;
  --font-size-md:  1rem;
  --font-size-lg:  1.125rem;
  --font-size-xl:  1.25rem;
  --font-size-2xl: 1.5rem;

  /* espacamento */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;

  /* bottom nav height (para padding das paginas) */
  --bottom-nav-height: 56px;
}
```

### Frontend: lib/api.ts

```typescript
// lib/api.ts
const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, ...rest } = options;

  const response = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...rest.headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 401) {
    // tenta refresh uma unica vez
    const refreshed = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });

    if (!refreshed.ok) {
      // redireciona para login (no cliente)
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw new Error('Session expired');
    }

    // reexecuta requisicao original
    return request<T>(path, options);
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
    throw new Error(error.message ?? 'Erro desconhecido');
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const api = {
  get:    <T>(path: string, options?: RequestOptions) =>
            request<T>(path, { ...options, method: 'GET' }),
  post:   <T>(path: string, body?: unknown, options?: RequestOptions) =>
            request<T>(path, { ...options, method: 'POST', body }),
  put:    <T>(path: string, body?: unknown, options?: RequestOptions) =>
            request<T>(path, { ...options, method: 'PUT', body }),
  delete: <T>(path: string, options?: RequestOptions) =>
            request<T>(path, { ...options, method: 'DELETE' }),
};
```

---

## API Endpoints

### Auth

| Metodo | Rota              | Descricao                          | Auth |
|--------|-------------------|------------------------------------|------|
| POST   | /auth/register    | Cadastro de novo usuario           | Nao  |
| POST   | /auth/login       | Login, emite cookies de token      | Nao  |
| POST   | /auth/refresh     | Renova access token via cookie     | Nao  |
| POST   | /auth/logout      | Invalida cookies de token          | Sim  |

### Users / Me

| Metodo | Rota                                  | Descricao                                  | Auth |
|--------|---------------------------------------|--------------------------------------------|------|
| GET    | /me/profile                           | Perfil e estatisticas do usuario logado    | Sim  |
| PUT    | /me/profile                           | Atualiza username, avatar e capa           | Sim  |
| GET    | /me/shows                             | Shows subscritos com progresso             | Sim  |
| GET    | /me/movies                            | Filmes assistidos / watchlist              | Sim  |
| GET    | /me/continue-watching                 | Proximo episodio de cada show acompanhado  | Sim  |
| GET    | /me/upcoming                          | Calendario de lancamentos agrupado por data| Sim  |
| GET    | /me/stats                             | Estatisticas detalhadas de consumo         | Sim  |
| GET    | /me/notifications                     | Notificacoes do usuario (cursor-based)     | Sim  |
| POST   | /me/notifications/:id/read            | Marca notificacao como lida                | Sim  |
| GET    | /me/lists                             | Listas customizadas do usuario             | Sim  |
| POST   | /me/lists                             | Cria nova lista customizada                | Sim  |
| GET    | /me/lists/:listId                     | Detalhe de uma lista                       | Sim  |
| PUT    | /me/lists/:listId                     | Atualiza nome/descricao de lista           | Sim  |
| DELETE | /me/lists/:listId                     | Remove lista customizada                   | Sim  |
| POST   | /me/lists/:listId/items               | Adiciona item (show ou movie) a lista      | Sim  |
| DELETE | /me/lists/:listId/items/:itemId       | Remove item da lista                       | Sim  |

### Shows

| Metodo | Rota                                  | Descricao                                        | Auth     |
|--------|---------------------------------------|--------------------------------------------------|----------|
| GET    | /shows                                | Catalogo de shows (paginacao cursor, filtros)    | Opcional |
| GET    | /shows/:id                            | Detalhe do show (aba Sobre)                      | Opcional |
| GET    | /shows/:id/seasons                    | Temporadas + episodios + progresso do usuario    | Opcional |
| POST   | /me/shows/:showId/subscribe           | Cria ou atualiza subscricao do usuario           | Sim      |
| DELETE | /me/shows/:showId/subscribe           | Remove subscricao do usuario                     | Sim      |

### Movies

| Metodo | Rota                  | Descricao                          | Auth     |
|--------|-----------------------|------------------------------------|----------|
| GET    | /movies/:id           | Detalhe do filme                   | Opcional |
| POST   | /movies/:id/watch     | Marca filme como assistido         | Sim      |
| DELETE | /movies/:id/watch     | Desmarca filme como assistido      | Sim      |
| POST   | /movies/:id/watchlist | Adiciona filme a watchlist         | Sim      |
| DELETE | /movies/:id/watchlist | Remove filme da watchlist          | Sim      |

### Watch (Episodios)

| Metodo | Rota                              | Descricao                                              | Auth |
|--------|-----------------------------------|--------------------------------------------------------|------|
| POST   | /episodes/:episodeId/watch        | Marca episodio como assistido (cria WatchProgress)     | Sim  |
| DELETE | /episodes/:episodeId/watch        | Desmarca episodio (remove WatchProgress)               | Sim  |
| POST   | /seasons/:seasonId/watch-all      | Marca todos os episodios da temporada                  | Sim  |
| DELETE | /seasons/:seasonId/watch-all      | Desmarca todos os episodios da temporada               | Sim  |

### Feed e Descobrir

| Metodo | Rota         | Descricao                                             | Auth     |
|--------|--------------|-------------------------------------------------------|----------|
| GET    | /feed        | Atividade dos usuarios seguidos (cursor-based)        | Sim      |
| GET    | /discover    | Shows e filmes populares/recomendados (cursor-based)  | Opcional |
| GET    | /search      | Busca shows e filmes por termo (?q=)                  | Opcional |

### Social

| Metodo | Rota                              | Descricao                                | Auth |
|--------|-----------------------------------|------------------------------------------|------|
| POST   | /users/:userId/follow             | Segue usuario                            | Sim  |
| DELETE | /users/:userId/follow             | Deixa de seguir usuario                  | Sim  |
| GET    | /users/:userId/followers          | Lista seguidores (cursor-based)          | Sim  |
| GET    | /users/:userId/following          | Lista quem o usuario segue (cursor-based)| Sim  |

---

## Security Design

### Tokens e Cookies

- **Access Token**: JWT HS256, expira em 15 minutos, armazenado em cookie `access_token` com flags `HttpOnly; Secure; SameSite=Strict; Path=/`
- **Refresh Token**: JWT HS256, expira em 30 dias, armazenado em cookie `refresh_token` com flags `HttpOnly; Secure; SameSite=Strict; Path=/auth/refresh`
- O `Path=/auth/refresh` no refresh token garante que o cookie so e enviado para o endpoint de refresh, reduzindo superficie de ataque

### Segredos de Ambiente (zod schema)

```typescript
// src/common/config/env.schema.ts
import { z } from 'zod';

export const envSchema = z.object({
  DATABASE_URL:          z.string().url(),
  JWT_ACCESS_SECRET:     z.string().min(32),
  JWT_REFRESH_SECRET:    z.string().min(32),
  TMDB_API_KEY:          z.string().min(10),
  FRONTEND_URL:          z.string().url(),
  NODE_ENV:              z.enum(['development', 'production', 'test']),
  THROTTLE_TTL:          z.coerce.number().default(60),
  THROTTLE_LIMIT:        z.coerce.number().default(100),
  PORT:                  z.coerce.number().default(3001),
});

export type Env = z.infer<typeof envSchema>;
```

### Content Security Policy (Frontend)

```javascript
// next.config.js (cabecalhos CSP)
const cspHeader = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' https://image.tmdb.org data:",
  "connect-src 'self'",
  "font-src 'self'",
  "frame-ancestors 'none'",
].join('; ');
```

### Rate Limiting

- Global: 100 requests / 60 segundos por IP (configuravel por env)
- Rotas de auth (`/auth/login`, `/auth/register`): override local com 10 requests / 60 segundos

---

## TMDB Sync Strategy

### Regras de Cache

| Situacao                           | Acao                                    |
|------------------------------------|-----------------------------------------|
| Item nao existe localmente         | Busca na TMDB, persiste, retorna        |
| `syncedAt` < 6 meses              | Retorna do cache local                  |
| `syncedAt` >= 6 meses             | Re-busca na TMDB, atualiza, retorna     |
| TMDB indisponivel + cache existente| Retorna cache com header de aviso       |
| TMDB indisponivel + sem cache      | HTTP 503 com mensagem generica          |

### Sync Job

- Executado diariamente via `@nestjs/schedule` (`@Cron`)
- Alvo: Shows com `SubscriptionStatus` `assistindo` ou `sem_assistir_ha_algum_tempo` cujo `syncedAt` esteja a menos de 7 dias de completar 6 meses
- Limite de re-sincronizacao: nunca ultrapassar 6 meses desde a data original de dados da TMDB
- Rate limit respeitado: maximo 40 requests/10s conforme limites da TMDB API (plano free)

---

## Error Handling

### ExceptionFilter Global

```typescript
// Exemplo do contrato de resposta de erro
// HTTP 400 - Validacao
{
  "statusCode": 400,
  "message": "email must be an email",
  "requestId": "req_01j2k3l4m5n6",
  "timestamp": "2026-08-28T12:00:00.000Z"
}

// HTTP 401 - Nao autenticado
{
  "statusCode": 401,
  "message": "Nao autenticado",
  "requestId": "req_01j2k3l4m5n6",
  "timestamp": "2026-08-28T12:00:00.000Z"
}

// HTTP 500 - Erro interno (nunca expoe stack trace ou mensagem do Postgres)
{
  "statusCode": 500,
  "message": "Erro interno no servidor",
  "requestId": "req_01j2k3l4m5n6",
  "timestamp": "2026-08-28T12:00:00.000Z"
}
```

### Mapeamento de Erros Prisma

O `ExceptionFilter` deve interceptar `PrismaClientKnownRequestError` e mapear:

| Codigo Prisma | HTTP Status | Mensagem ao cliente               |
|---------------|-------------|-----------------------------------|
| P2002          | 409         | "Recurso ja existe"               |
| P2025          | 404         | "Recurso nao encontrado"          |
| P2003          | 400         | "Referencia invalida"             |
| Outros         | 500         | "Erro interno no servidor"        |

---

## Frontend Component Contracts

### PosterCard

```typescript
interface PosterCardProps {
  showId?: string;
  movieId?: string;
  title: string;
  posterPath: string | null;
  progressPercent?: number;       // 0-100, exibe ProgressBar se definido
  progressColor?: 'yellow' | 'green' | 'purple';
  showTitle?: boolean;
  onClick?: () => void;
}
```

### EpisodeListItem

```typescript
interface EpisodeListItemProps {
  showName: string;
  showId: string;
  seasonNumber: number;
  episodeNumber: number;
  remainingCount: number;         // o "+43" ou "+3" ao lado do codigo
  episodeName: string;
  thumbnailUrl: string | null;
  isWatched: boolean;
  badge?: 'NOVO' | 'PREMIERE';
  onToggleWatch: () => void;
}
```

### UpcomingItem (lista)

```typescript
interface UpcomingItemProps {
  type: 'episode' | 'movie';
  showName?: string;
  showId?: string;
  movieName?: string;
  movieId?: string;
  seasonNumber?: number;
  episodeNumber?: number;
  episodeName: string;
  thumbnailUrl: string | null;
  isNew: boolean;
  platform?: string;
  airTime?: string;
  isWatched: boolean;
  onToggleWatch: () => void;
}
```

### ProgressBar

```typescript
interface ProgressBarProps {
  percent: number;                // 0-100
  color: 'yellow' | 'green' | 'purple';
  height?: number;                // px, default 3
  className?: string;
}
```

---

## Docker Compose (dev)

```yaml
# docker-compose.yml
version: '3.9'

services:
  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: tvtime_app
      POSTGRES_PASSWORD: tvtime_dev_password
      POSTGRES_DB: tvtime_dev
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U tvtime_app -d tvtime_dev']
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

---

## CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  backend:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: tvtime_test
          POSTGRES_PASSWORD: tvtime_test
          POSTGRES_DB: tvtime_test
        ports: ['5432:5432']
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'yarn' }
      - run: yarn install --frozen-lockfile
        working-directory: backend
      - run: yarn lint
        working-directory: backend
      - run: yarn type-check
        working-directory: backend
      - run: yarn prisma migrate deploy
        working-directory: backend
        env:
          DATABASE_URL: postgresql://tvtime_test:tvtime_test@localhost:5432/tvtime_test
      - run: yarn test --run
        working-directory: backend
        env:
          DATABASE_URL: postgresql://tvtime_test:tvtime_test@localhost:5432/tvtime_test
          JWT_ACCESS_SECRET: test_access_secret_min_32_chars_here
          JWT_REFRESH_SECRET: test_refresh_secret_min_32_chars_here
          TMDB_API_KEY: test_key
          FRONTEND_URL: http://localhost:3000
          NODE_ENV: test

  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'yarn' }
      - run: yarn install --frozen-lockfile
        working-directory: frontend
      - run: yarn lint
        working-directory: frontend
      - run: yarn type-check
        working-directory: frontend
      - run: yarn build
        working-directory: frontend
        env:
          NEXT_PUBLIC_API_URL: http://localhost:3001
```
