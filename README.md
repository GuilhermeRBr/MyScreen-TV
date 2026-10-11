<div align="center">

<h1 align="center">MyScreen TV — Catalogo de Series e Filmes</h1>

<p align="center">
  <strong>MyScreen TV e uma plataforma open-source para catalogacao e acompanhamento de series e filmes, desenvolvida para quem quer organizar o que assiste com Next.js, NestJS, TypeScript e PostgreSQL.</strong>
</p>

<p align="center">
  <a href="#"><img alt="License" src="https://img.shields.io/badge/license-MIT-blue"></a>
  <a href="#"><img alt="GitHub repo size" src="https://img.shields.io/github/repo-size/GuilhermeRBr/myscreen-tv?color=green"></a>
  <a href="#"><img alt="Last Commit" src="https://img.shields.io/github/last-commit/GuilhermeRBr/myscreen-tv?color=purple"></a>
</p>

<br />

<p align="center">
  <img src="https://skillicons.dev/icons?i=nextjs,ts,nestjs,prisma,postgres,docker" alt="Tech Stack Icons" />
</p>

</div>

---

## Sobre o projeto

O **MyScreen TV** e uma aplicacao web para **acompanhamento de series e filmes**, com foco em progresso por temporada, estatisticas de perfil e calendario de lancamentos.

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
| ![Redis](https://img.shields.io/badge/-Redis-DC382D?style=flat&logo=redis&logoColor=white) | Armazenamento de filas (BullMQ) |
| ![Docker](https://img.shields.io/badge/-Docker-2496ED?style=flat&logo=docker&logoColor=white) | Ambiente de desenvolvimento local |

---

## Como rodar o projeto

### Pre-requisitos

- [Node.js 20+](https://nodejs.org)
- [Yarn](https://yarnpkg.com)
- [Docker](https://www.docker.com)
- Chave da [TMDB API](https://www.themoviedb.org/settings/api) (gratuita)

### 1. Banco de dados e Redis

```bash
# Na raiz do projeto
cp docker-compose.override.yml.example docker-compose.override.yml

# Edite docker-compose.override.yml com suas senhas locais e suba os servicos
docker compose up -d
```

O Docker Compose sobe:

- **PostgreSQL 16** na porta `5432`
- **Redis 7** na porta `6379` com persistencia AOF e politica `noeviction`

### 2. Backend

```bash
cd backend

# Configure as variaveis de ambiente
cp .env.example .env
# Edite .env com DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET, TMDB_API_KEY e REDIS_PASSWORD

# Instale as dependencias
yarn install

# Crie as tabelas no banco
yarn prisma migrate dev --name init

# Inicie o servidor (backend + workers de fila integrados)
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

## Filas assincronas (BullMQ + Redis)

O backend usa BullMQ para processar tarefas demoradas sem bloquear a API.

### Caso de uso atual: envio de e-mails

O endpoint `POST /auth/forgot-password` responde imediatamente apos enfileirar o job. O worker consome o job em background e chama o provedor Resend.

Fluxo:

1. Endpoint recebe a solicitacao e valida o DTO
2. `AuthService` gera o token, persiste o hash no banco e chama `EmailQueueService.enqueuePasswordReset`
3. A API retorna `200 OK` sem aguardar o envio
4. `EmailProcessor` consome o job, monta o link e chama `EmailService.sendPasswordResetEmail`
5. Em caso de falha recuperavel, o BullMQ reprocessa com backoff exponencial (3 tentativas: 5 s, 10 s, 20 s)
6. Falhas definitivas ficam retidas no Redis por 7 dias para diagnostico

### Variaveis de ambiente

| Variavel | Obrigatoria | Descricao |
|----------|-------------|-----------|
| `REDIS_HOST` | Sim | Endereco do Redis |
| `REDIS_PORT` | Sim | Porta (padrao `6379`) |
| `REDIS_PASSWORD` | Nao | Senha do Redis (obrigatoria em producao) |
| `REDIS_USERNAME` | Nao | Usuario ACL do Redis |
| `REDIS_DB` | Nao | Numero do banco (padrao `0`) |
| `REDIS_TLS` | Nao | `true` para habilitar TLS (obrigatorio em producao) |
| `EMAIL_QUEUE_CONCURRENCY` | Nao | Jobs em paralelo por instancia (padrao `5`) |
| `ENABLE_BULL_BOARD` | Nao | `true` para habilitar o painel de filas |
| `BULL_BOARD_USER` | Condicional | Usuario do painel (obrigatorio quando `ENABLE_BULL_BOARD=true`) |
| `BULL_BOARD_PASSWORD` | Condicional | Senha do painel (obrigatorio quando `ENABLE_BULL_BOARD=true`) |

### Bull Board (painel de inspecao)

O painel e desabilitado por padrao. Para habilitar em desenvolvimento:

```bash
# backend/.env
ENABLE_BULL_BOARD=true
BULL_BOARD_USER=admin
BULL_BOARD_PASSWORD=senha_segura
```

> Painel disponivel em `http://localhost:3001/queues` apos reiniciar o servidor.
> **Nunca habilite sem credenciais configuradas.** O backend rejeita a configuracao incompleta.

### Escalabilidade horizontal

Os workers rodam no mesmo processo NestJS. Para escalar:

1. Aumente `EMAIL_QUEUE_CONCURRENCY` para processar mais jobs por instancia.
2. Suba multiplas instancias do backend apontando para o mesmo Redis — o BullMQ distribui os jobs automaticamente entre os workers.
3. Respeite os limites de envio do seu plano Resend ao configurar a concorrencia.

### Comportamento durante indisponibilidade do Redis

- Se o Redis ficar indisponivel, a API continua operando, mas o enfileiramento falha.
- O `AuthService` propaga o erro para o controller, que retorna `500` ao cliente.
- Quando o Redis voltar, o worker retoma o processamento dos jobs ja enfileirados.
- Jobs pendentes sobrevivem a reinicializacoes do Redis gracias a persistencia AOF.

---

## Estrutura de Pastas

```
myscreen-tv/
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
