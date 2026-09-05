<div align="center">

<h1 align="center">TV Time — Catalogo de Series e Filmes</h1>

<p align="center">
  <strong>TV Time e uma plataforma open-source para catalogacao e acompanhamento de series e filmes, desenvolvida para quem quer organizar o que assiste com Next.js, NestJS, TypeScript e PostgreSQL.</strong>
</p>

<p align="center">
  <a href="#"><img alt="License" src="https://img.shields.io/badge/license-MIT-blue"></a>
  <a href="#"><img alt="GitHub repo size" src="https://img.shields.io/github/repo-size/GuilhermeRBr/tv-time?color=green"></a>
  <a href="#"><img alt="Last Commit" src="https://img.shields.io/github/last-commit/GuilhermeRBr/tv-time?color=purple"></a>
</p>

<br />

<p align="center">
  <img src="https://skillicons.dev/icons?i=nextjs,ts,nestjs,prisma,postgres,docker" alt="Tech Stack Icons" />
</p>

</div>

---

## Sobre o projeto

O **TV Time** e uma aplicacao web para **acompanhamento de series e filmes**, inspirada no app TV Time, com foco em progresso por temporada, estatisticas de perfil e calendario de lancamentos.

> Desenvolvido para quem quer ter controle total sobre o que assiste, com uma experiencia visual moderna e dados em tempo real via TMDB.

Funcionalidades:

- Seguir series e filmes e marcar episodios como assistidos
- Progresso por temporada com barra visual (X/Y episodios)
- "Continuar assistindo" — proximo episodio nao assistido
- "Em breve" — calendario de lancamentos das series que voce acompanha
- Listas customizadas (Revendo, Assistir a Seguir, etc.)
- Perfil com estatisticas: tempo assistido, episodios, filmes
- Explorar: feed de tendencias e descobrir conteudo novo
- Autenticacao segura com JWT em cookies HttpOnly
- Dados de series e filmes via TMDB API

---

## Tecnologias Usadas

| Tecnologia | Descricao |
|------------|-----------|
| ![Next.js](https://img.shields.io/badge/-Next.js-000?style=flat&logo=next.js&logoColor=white) | Frontend com App Router |
| ![TypeScript](https://img.shields.io/badge/-TypeScript-3178C6?style=flat&logo=typescript&logoColor=white) | Tipagem estatica em todo o projeto |
| ![NestJS](https://img.shields.io/badge/-NestJS-E0234E?style=flat&logo=nestjs&logoColor=white) | Backend modular e escalavel |
| ![Prisma](https://img.shields.io/badge/-Prisma-2D3748?style=flat&logo=prisma&logoColor=white) | ORM type-safe para PostgreSQL |
| ![PostgreSQL](https://img.shields.io/badge/-PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white) | Banco de dados relacional |
| ![Docker](https://img.shields.io/badge/-Docker-2496ED?style=flat&logo=docker&logoColor=white) | Ambiente de desenvolvimento local |

---

## Como rodar o projeto

### Pre-requisitos

- [Node.js 20+](https://nodejs.org)
- [Yarn](https://yarnpkg.com)
- [Docker](https://www.docker.com)
- Chave da [TMDB API](https://www.themoviedb.org/settings/api) (gratuita)

### 1. Banco de dados

```bash
# Na raiz do projeto
cp docker-compose.override.yml.example docker-compose.override.yml

# Edite docker-compose.override.yml com sua senha local e suba o Postgres
docker compose up -d
```

### 2. Backend

```bash
cd backend

# Configure as variaveis de ambiente
cp .env.example .env
# Edite .env com DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET e TMDB_API_KEY

# Instale as dependencias
yarn install

# Crie as tabelas no banco
yarn prisma migrate dev --name init

# Inicie o servidor
yarn start:dev
```

> Backend disponivel em `http://localhost:3001`

### 3. Frontend

```bash
cd frontend

# Configure as variaveis de ambiente
cp .env.example .env.local

# Instale as dependencias
yarn install

# Inicie o servidor
yarn dev
```

> Frontend disponivel em `http://localhost:3000`

> **Atencao:** A `TMDB_API_KEY` no `backend/.env` e obrigatoria para busca de series e filmes.

---

## Estrutura de Pastas

```
tv-time/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma
│   └── src/
│       ├── auth/
│       ├── users/
│       ├── shows/
│       ├── movies/
│       ├── watch/
│       ├── lists/
│       ├── feed/
│       ├── tmdb/
│       ├── prisma/
│       └── common/
├── frontend/
│   └── src/
│       ├── app/
│       │   ├── (tabs)/
│       │   │   ├── series/
│       │   │   ├── filmes/
│       │   │   ├── explorar/
│       │   │   └── perfil/
│       │   └── show/[id]/
│       │       ├── sobre/
│       │       └── episodios/
│       ├── components/
│       │   ├── BottomNav/
│       │   ├── PosterCard/
│       │   └── icons/
│       ├── lib/
│       └── styles/
├── docker-compose.yml
└── README.md
```

---

## Colaboradores

<table align="center">
  <tr>
    <td align="center">
      <img src="https://github.com/GuilhermeRBr.png" width="100px;" alt="Guilherme Reboucas"/><br />
      <sub><b>Guilherme Reboucas</b></sub><br />
      <a href="https://github.com/GuilhermeRBr" target="_blank">@GuilhermeRBr</a>
    </td>
  </tr>
</table>

---

## Atribuicao de dados

Este produto usa a API do TMDB mas nao e endossado ou certificado pelo TMDB.

---

## Licenca

Este projeto esta licenciado sob a [MIT License](LICENSE).
