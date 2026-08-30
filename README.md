# TV Time — Catálogo de Séries e Filmes

Aplicação de catalogação inspirada no TV Time. Permite ao usuário seguir séries e filmes, marcar episódios como assistidos, acompanhar progresso por temporada, criar listas customizadas, ver o que está "em breve" e visualizar estatísticas de perfil.

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 14 (App Router) + CSS Modules |
| Backend | NestJS + Prisma |
| Banco de dados | PostgreSQL 16 |
| Gerenciador de pacotes | Yarn |
| Dados externos | TMDB API |

## Estrutura

```
/backend    — NestJS API
/frontend   — Next.js App
docker-compose.yml — PostgreSQL local
```

## Como rodar localmente

### 1. Banco de dados

```bash
cp docker-compose.override.yml.example docker-compose.override.yml
# edite docker-compose.override.yml com sua senha local
docker compose up -d
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# preencha as variáveis no .env
yarn install
yarn prisma migrate dev
yarn start:dev
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env.local
# preencha NEXT_PUBLIC_API_URL
yarn install
yarn dev
```

## Atribuicao de dados

Este produto usa a API do TMDB mas não é endossado ou certificado pelo TMDB.
