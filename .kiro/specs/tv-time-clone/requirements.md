# Requirements Document

## Introduction

Aplicacao de catalogacao de series e filmes inspirada no TV Time. Permite ao usuario acompanhar series e filmes, marcar episodios como assistidos (individual ou em lote), visualizar progresso por temporada, acessar um calendario de lancamentos futuros ("Em Breve"), explorar novos conteudos e gerenciar um perfil com estatisticas de consumo. A fonte de dados de catalogo e a TMDB API com cache local de ate 6 meses. O sistema e composto por um backend NestJS + Prisma + PostgreSQL e um frontend Next.js com CSS Modules.

---

## Glossary

- **System**: o conjunto frontend + backend da aplicacao.
- **Frontend**: a aplicacao Next.js (App Router) servida ao navegador.
- **Backend**: a API NestJS que processa todas as regras de negocio.
- **Prisma_Client**: o ORM que executa todas as queries ao PostgreSQL.
- **TMDB_API**: a API publica The Movie Database, fonte primaria de dados de catalogo.
- **TMDB_Cache**: registro local (PostgreSQL) de dados vindos da TMDB_API, com validade maxima de 6 meses.
- **User**: usuario autenticado da aplicacao.
- **Show**: serie de televisao com temporadas e episodios.
- **Season**: conjunto de episodios de uma temporada de um Show.
- **Episode**: unidade minima de um Show, pertencente a uma Season.
- **Movie**: filme catalogado.
- **WatchProgress**: registro que indica que um User assistiu a um Episode.
- **MovieWatch**: registro que indica que um User assistiu a um Movie ou o adicionou a watchlist.
- **UserShowSubscription**: vinculo entre User e Show com um campo de status.
- **SubscriptionStatus**: enumeracao com os valores `assistindo`, `revendo`, `parado`, `sem_assistir_ha_algum_tempo`.
- **CustomList**: lista personalizada criada por um User contendo Shows e/ou Movies.
- **ProgressBar**: indicador visual (barra colorida) da proporcao de episodios assistidos em uma Season ou Show.
- **ContinueWatching**: proximo Episode nao assistido de um Show que o User esta acompanhando.
- **UpcomingCalendar**: agrupamento de Episodes e Movies a serem lancados, ordenados por data.
- **Feed**: aba "Feed" da tela Explorar, exibindo atividade da rede social do User.
- **Discover**: aba "Descobrir" da tela Explorar, exibindo conteudo novo/popular.
- **Auth_Service**: modulo responsavel por autenticacao e emissao de tokens.
- **JWT**: JSON Web Token usado para autenticacao stateless.
- **HttpOnly_Cookie**: cookie nao acessivel por JavaScript, usado para armazenar tokens de forma segura.
- **ValidationPipe**: pipe global do NestJS que valida e transforma DTOs de entrada.
- **ExceptionFilter**: filtro global do NestJS que sanitiza erros antes de devolver resposta HTTP.
- **RBAC**: controle de acesso baseado em papeis (`user`, `admin`).
- **Sync_Job**: job agendado que re-sincroniza dados de catalogo com a TMDB_API.
- **SVG_Icon**: componente de icone implementado como SVG inline, nunca emoji.

---

## Requirements

### Requirement 1: Estrutura do Repositorio

**User Story:** Como desenvolvedor, quero uma estrutura de repositorio padronizada com monorepo (frontend/backend separados), docker-compose e gitignore, para que o ambiente de desenvolvimento seja reproduzivel e seguro desde o primeiro clone.

#### Acceptance Criteria

1. THE System SHALL organizar o repositorio com as pastas `/frontend` (Next.js), `/backend` (NestJS) e um `docker-compose.yml` na raiz.
2. THE System SHALL incluir um `.gitignore` na raiz cobrindo `.env`, `.env.*.local`, `node_modules`, `dist` e `*.local`.
3. THE System SHALL incluir um `docker-compose.yml` que suba instancias de PostgreSQL e, opcionalmente, PgBouncer para dev local.
4. WHEN o `docker-compose.yml` sobe o servico PostgreSQL, THE System SHALL configurar um usuario dedicado com permissoes restritas (SELECT, INSERT, UPDATE, DELETE) e nunca o superusuario `postgres`.

---

### Requirement 2: Backend Base NestJS

**User Story:** Como desenvolvedor, quero um backend NestJS configurado com seguranca e validacao globais, para que toda API seja protegida e robusta por padrao.

#### Acceptance Criteria

1. THE Backend SHALL aplicar o modulo `helmet` globalmente para definir cabecalhos de seguranca HTTP (HSTS, X-Frame-Options, X-Content-Type-Options).
2. THE Backend SHALL aplicar `@nestjs/throttler` globalmente com rate limiting configuravel por IP.
3. THE Backend SHALL configurar CORS restrito ao dominio exato do Frontend; nunca permitir `origin: '*'` em producao.
4. THE Backend SHALL registrar um `ValidationPipe` global com `whitelist: true`, `forbidNonWhitelisted: true` e `transform: true`.
5. THE Backend SHALL registrar um `ExceptionFilter` global que sanitiza stack traces e mensagens brutas do PostgreSQL antes de devolver resposta HTTP.
6. WHEN o Backend inicializa, THE Backend SHALL validar todas as variaveis de ambiente obrigatorias usando um schema `zod`; IF alguma variavel estiver ausente ou invalida, THEN THE Backend SHALL encerrar o processo com mensagem de erro descritiva.
7. THE Backend SHALL estruturar o codigo em modulos por dominio: `AuthModule`, `UsersModule`, `ShowsModule`, `MoviesModule`, `WatchModule`, `ListsModule`, `FeedModule` e `PrismaModule`.

---

### Requirement 3: Modelagem Prisma e Banco de Dados

**User Story:** Como desenvolvedor, quero um schema Prisma completo e versionado, para que o modelo de dados cubra todas as funcionalidades do app e seja migravel de forma reproducivel.

#### Acceptance Criteria

1. THE Prisma_Client SHALL implementar os models: `User`, `Follow`, `Show`, `Season`, `Episode`, `Cast`, `ShowCast`, `Movie`, `WatchProgress`, `MovieWatch`, `UserShowSubscription`, `CustomList`, `CustomListItem`, `Comment` e `Notification`.
2. THE Prisma_Client SHALL definir o campo `status` de `UserShowSubscription` como enum com os valores `assistindo`, `revendo`, `parado` e `sem_assistir_ha_algum_tempo`.
3. THE Prisma_Client SHALL armazenar em `Show`, `Season`, `Episode` e `Movie` o campo `tmdbId` (inteiro unico) para rastreabilidade com a TMDB_API.
4. THE Prisma_Client SHALL armazenar em `TMDB_Cache` (ou campo `syncedAt` nos models de catalogo) a data da ultima sincronizacao com a TMDB_API.
5. WHEN um model de catalogo (`Show`, `Season`, `Episode`, `Movie`) e criado ou atualizado, THE Prisma_Client SHALL registrar o campo `syncedAt` com a data e hora correntes.
6. THE Prisma_Client SHALL garantir constraints de unicidade: um par `(userId, episodeId)` nao pode ter mais de um `WatchProgress`; um par `(userId, showId)` nao pode ter mais de um `UserShowSubscription`.

---

### Requirement 4: Autenticacao e Autorizacao

**User Story:** Como User, quero me registrar, fazer login e ter minha sessao mantida com seguranca, para que meus dados de progresso e listas sejam privados.

#### Acceptance Criteria

1. WHEN um User envia credenciais validas para `POST /auth/login`, THE Auth_Service SHALL emitir um Access Token (vida curta, minimo HS256) e um Refresh Token (vida longa) em cookies `HttpOnly`, `Secure` e `SameSite=Strict`.
2. WHEN um User envia credenciais invalidas para `POST /auth/login`, THE Auth_Service SHALL retornar HTTP 401 com mensagem generica, sem revelar se o email ou a senha estao errados.
3. WHEN um Access Token expira e o User possui Refresh Token valido, THE Auth_Service SHALL emitir novos tokens via `POST /auth/refresh` sem exigir novo login.
4. WHEN um User acessa `POST /auth/logout`, THE Auth_Service SHALL invalidar os cookies de token no cliente.
5. THE Backend SHALL proteger todas as rotas que exigem autenticacao com `JwtAuthGuard`.
6. THE Backend SHALL proteger rotas administrativas com `RolesGuard` verificando o papel `admin` via RBAC.
7. WHEN um User nao autenticado tenta acessar rota protegida, THE Backend SHALL retornar HTTP 401.
8. WHEN um User autenticado sem permissao de admin tenta acessar rota de admin, THE Backend SHALL retornar HTTP 403.

---

### Requirement 5: Integracao com TMDB API

**User Story:** Como User, quero visualizar dados atualizados de series e filmes vindos da TMDB, para que o catalogo do app esteja sempre correto.

#### Acceptance Criteria

1. WHEN o Backend busca dados de um `Show`, `Season`, `Episode` ou `Movie` nao existente localmente, THE Backend SHALL consultar a TMDB_API e persistir o resultado no TMDB_Cache.
2. WHEN o Backend busca dados de um item existente no TMDB_Cache com `syncedAt` ha mais de 6 meses, THE Backend SHALL re-consultar a TMDB_API e atualizar o TMDB_Cache.
3. WHEN o Backend busca dados de um item existente no TMDB_Cache com `syncedAt` dentro de 6 meses, THE Backend SHALL retornar os dados do TMDB_Cache sem consultar a TMDB_API.
4. THE Sync_Job SHALL re-sincronizar automaticamente Shows com `SubscriptionStatus` `assistindo` ou `sem_assistir_ha_algum_tempo` cujo `syncedAt` esteja proximo do vencimento (dentro de 7 dias do limite de 6 meses).
5. IF a TMDB_API retornar erro ou indisponibilidade, THEN THE Backend SHALL retornar os dados do TMDB_Cache existentes, se houver, e logar o erro; IF nao houver cache, THEN THE Backend SHALL retornar HTTP 503 com mensagem generica.
6. THE Backend SHALL atribuir creditos visiveis a TMDB na API de dados de catalogo (`X-Data-Source: TMDB` no cabecalho de resposta) e o Frontend SHALL exibir a atribuicao "This product uses the TMDB API but is not endorsed or certified by TMDB." na tela de Perfil/Sobre.

---

### Requirement 6: Gerenciamento de Shows e Subscricao

**User Story:** Como User, quero seguir series, definir meu status de acompanhamento e visualizar todas as series que sigo em uma lista organizada, para que eu controle minha fila de conteudo.

#### Acceptance Criteria

1. WHEN um User acessa `GET /shows`, THE Backend SHALL retornar a lista de Shows do catalogo com suporte a paginacao (cursor-based) e filtros por genero, status e rede de TV.
2. WHEN um User cria ou atualiza uma `UserShowSubscription` via `POST /me/shows/:showId/subscribe`, THE Backend SHALL persistir o `SubscriptionStatus` informado.
3. THE Backend SHALL aceitar exatamente os seguintes valores de `SubscriptionStatus`: `assistindo`, `revendo`, `parado`, `sem_assistir_ha_algum_tempo`.
4. WHEN um User acessa `GET /me/shows`, THE Backend SHALL retornar os Shows subscritos com o `SubscriptionStatus` atual, contagem de episodios assistidos por Season e percentual de progresso total do Show.
5. THE Frontend SHALL exibir a tela "Minha Lista" com chips de filtro por `SubscriptionStatus` e alternador de visualizacao em grid (3 colunas) ou lista.
6. THE Frontend SHALL exibir em cada card de Show na visualizacao grid um poster, o nome do Show e uma `ProgressBar` colorida na parte inferior indicando o percentual de episodios assistidos.
7. THE Frontend SHALL diferenciar o status do Show por cor na `ProgressBar`: amarelo para `assistindo`, roxo para `parado` ou `sem_assistir_ha_algum_tempo`, verde para concluido (100% dos episodios assistidos).
8. THE Frontend SHALL exibir em cada item de Show na visualizacao lista: thumbnail, nome como chip clicavel, codigo do proximo episodio (ex: "T01 | E05 +3"), titulo do episodio e um botao circular de check implementado como `SVG_Icon`.

---

### Requirement 7: Marcacao de Episodios como Assistidos

**User Story:** Como User, quero marcar episodios como assistidos individualmente ou por temporada inteira, para que meu progresso seja registrado corretamente.

#### Acceptance Criteria

1. WHEN um User envia `POST /episodes/:episodeId/watch`, THE Backend SHALL criar um `WatchProgress` para o par `(userId, episodeId)` se ainda nao existir.
2. WHEN um User envia `DELETE /episodes/:episodeId/watch`, THE Backend SHALL remover o `WatchProgress` correspondente ao par `(userId, episodeId)`.
3. WHEN um User envia `POST /seasons/:seasonId/watch-all`, THE Backend SHALL criar `WatchProgress` para todos os Episodes da Season que ainda nao possuem registro, em uma unica transacao atomica.
4. WHEN um User envia `DELETE /seasons/:seasonId/watch-all`, THE Backend SHALL remover todos os `WatchProgress` do User para Episodes da Season, em uma unica transacao atomica.
5. AFTER a criacao ou remocao de um `WatchProgress`, THE Backend SHALL recalcular e atualizar os contadores de episodios assistidos e o tempo total assistido associados ao User.
6. THE Backend SHALL retornar o estado atualizado (episodios assistidos, progresso percentual da Season) na resposta de `POST /episodes/:episodeId/watch` e `POST /seasons/:seasonId/watch-all`.

---

### Requirement 8: Continuar Assistindo

**User Story:** Como User, quero ver o proximo episodio a assistir de cada serie que sigo, para que eu nao precise procurar onde parei.

#### Acceptance Criteria

1. WHEN um User acessa `GET /me/continue-watching`, THE Backend SHALL retornar a lista de Shows com `SubscriptionStatus` `assistindo` ou `revendo`, cada um com o proximo Episode nao assistido (o de menor numero de episodio na Season de menor numero sem WatchProgress).
2. THE Frontend SHALL exibir a secao "Continuar acompanhando" como carrossel horizontal na aba Episodios da tela de detalhe do Show, com thumbnail do Episode, codigo (ex: "T02 | E03"), titulo e botao circular de check (`SVG_Icon`).
3. IF todos os Episodes de um Show estiverem marcados como assistidos, THEN THE Backend SHALL nao incluir esse Show na resposta de `GET /me/continue-watching`.

---

### Requirement 9: Tela de Detalhe do Show

**User Story:** Como User, quero acessar uma tela de detalhe de uma serie com informacoes completas, elenco, episodios e meu progresso por temporada, para que eu tenha todas as informacoes relevantes em um so lugar.

#### Acceptance Criteria

1. WHEN um User acessa `GET /shows/:showId`, THE Backend SHALL retornar: titulo, backdrop, generos, ano de inicio e fim, status de exibicao (encerrada/em exibicao), rede de TV, avaliacao TMDB (nota 0-10 com uma casa decimal), sinopse, duracao media de episodio, contagem de usuarios que adicionaram o Show e lista de elenco principal (nome do ator e nome do personagem).
2. WHEN um User acessa `GET /shows/:showId/seasons`, THE Backend SHALL retornar todas as Seasons com: numero, quantidade total de Episodes, quantidade de Episodes assistidos pelo User e lista de Episodes (numero, titulo, data de exibicao, duracao, sinopse resumida).
3. THE Frontend SHALL exibir a tela de detalhe com header contendo imagem de backdrop, seta de voltar e menu de opcoes ("...").
4. THE Frontend SHALL exibir no header da tela de detalhe: numero de temporadas, status de exibicao, rede de TV e percentual de progresso total do User.
5. THE Frontend SHALL exibir a aba "Sobre" contendo: sinopse, informacoes da serie (ano, generos, avaliacao com `SVG_Icon` de estrela, rede, duracao), secao "Elenco", secao "Semelhante a" e secao "Estrelas da serie".
6. THE Frontend SHALL exibir a aba "Episodios" contendo: carrossel "Continuar acompanhando", botao de marcar todos os episodios e lista de Seasons expansiveis.
7. THE Frontend SHALL exibir em cada linha de Season: numero da Season, contagem "X/Y episodios", `ProgressBar` verde no rodape da linha e um `SVG_Icon` de check verde quando a Season estiver completa.
8. THE Frontend SHALL exibir a avaliacao TMDB com o logotipo "T" da TMDB seguido de `SVG_Icon` de estrelas preenchidas/vazias proporcionais a nota.

---

### Requirement 10: Calendario Em Breve

**User Story:** Como User, quero ver um calendario de proximos lancamentos de series e filmes que sigo, para que eu nao perca nenhum episodio ou estreia.

#### Acceptance Criteria

1. WHEN um User acessa `GET /me/upcoming`, THE Backend SHALL retornar Episodes e Movies de Shows/filmes subscritos com data de exibicao futura ou ocorrida nos ultimos 7 dias, agrupados por data.
2. THE Backend SHALL rotular cada grupo de data como: "HOJE", "ONTEM", "AMANHA", dia da semana em maiusculas (ex: "SEXTA-FEIRA") para datas dentro de 6 dias, ou a data por extenso (ex: "12 DE JUL. DE 2026") para datas mais distantes.
3. THE Frontend SHALL exibir a aba "Em Breve" dentro de "Minha Lista" com alternador de visualizacao em grid e lista.
4. THE Frontend SHALL exibir na visualizacao grid: poster do Show/Movie e, para lancamentos futuros, um contador regressivo em dias (ex: "1 DIA") sobre o poster; Episodes ja disponiveis nao exibem contador.
5. THE Frontend SHALL exibir na visualizacao lista: chip com nome do Show, codigo do episodio, titulo do episodio, e badge "NOVO" (texto) para episodios lancados nas ultimas 24 horas; para episodios futuros, THE Frontend SHALL exibir horario de exibicao e nome da plataforma (ex: "Disney+", "Apple TV") no lugar do badge.
6. IF um Episode ou Movie nao possuir data de exibicao cadastrada, THEN THE Backend SHALL excluir esse item da resposta de `GET /me/upcoming`.

---

### Requirement 11: Tela Explorar

**User Story:** Como User, quero explorar novos conteudos e ver a atividade da minha rede, para que eu descubra series e filmes que ainda nao conheco.

#### Acceptance Criteria

1. THE Frontend SHALL exibir a tela Explorar com barra de pesquisa no topo e quatro abas: "FEED", "DESCOBRIR", "GRUPOS" e "ATIVIDADE".
2. WHEN um User digita na barra de pesquisa da tela Explorar, THE Frontend SHALL enviar `GET /search?q={termo}` ao Backend com debounce de 300ms e exibir resultados de Shows e Movies.
3. WHEN um User acessa a aba "DESCOBRIR", THE Backend SHALL retornar `GET /discover` com Shows e Movies populares ou recomendados, paginados por cursor.
4. THE Frontend SHALL exibir cada item da aba "DESCOBRIR" como card grande com: imagem de backdrop, `SVG_Icon` de play centralizado, `SVG_Icon` de clapperboard com titulo, duracao, generos e descricao truncada com botao "+" no canto superior direito para adicionar a lista.
5. WHEN um User acessa a aba "FEED", THE Backend SHALL retornar `GET /feed` com atividades recentes dos usuarios seguidos pelo User (episodios assistidos, avaliacao de Shows).
6. THE Backend SHALL suportar paginacao por cursor em `GET /feed` e `GET /discover`.

---

### Requirement 12: Perfil e Estatisticas do Usuario

**User Story:** Como User, quero ver meu perfil com estatisticas de consumo, listas customizadas e poder editar meus dados, para que eu acompanhe meu historico e personalize minha presenca no app.

#### Acceptance Criteria

1. WHEN um User acessa `GET /me/profile`, THE Backend SHALL retornar: avatar, imagem de capa, username, contagem de usuarios seguindo, contagem de seguidores, contagem de comentarios, tempo total assistindo TV (calculado a partir dos `WatchProgress` e duracoes de Episodes) e total de episodios assistidos.
2. THE Backend SHALL calcular o tempo total de TV decomposto em meses, dias e horas a partir da soma das duracoes de todos os Episodes com `WatchProgress` registrado para o User.
3. THE Frontend SHALL exibir a tela de Perfil com: imagem de capa no topo, avatar circular, username, botao "EDITAR", contadores de seguindo/seguidores/comentarios, secao "Estatisticas" expansivel, secao "Listas" expansivel e secoes "Series" e "Filmes" com carrosseis horizontais de posters.
4. THE Frontend SHALL exibir `SVG_Icon` de sino (notificacoes) no canto superior esquerdo e menu "..." no canto superior direito da tela de Perfil.
5. WHEN um User acessa `PUT /me/profile`, THE Backend SHALL atualizar username, avatar e imagem de capa, validando que o username tenha entre 3 e 30 caracteres alfanumericos.
6. THE Frontend SHALL exibir na tela de Perfil/Sobre a atribuicao obrigatoria: "This product uses the TMDB API but is not endorsed or certified by TMDB." com link para `https://www.themoviedb.org`.

---

### Requirement 13: Listas Customizadas

**User Story:** Como User, quero criar e gerenciar listas customizadas de series e filmes, para que eu organize meu conteudo favorito da forma que preferir.

#### Acceptance Criteria

1. WHEN um User envia `POST /me/lists`, THE Backend SHALL criar uma `CustomList` com nome (obrigatorio, entre 1 e 100 caracteres), descricao opcional e imagem de capa opcional.
2. WHEN um User envia `POST /me/lists/:listId/items`, THE Backend SHALL adicionar um Show ou Movie a `CustomList` correspondente, criando um `CustomListItem`.
3. WHEN um User envia `DELETE /me/lists/:listId/items/:itemId`, THE Backend SHALL remover o `CustomListItem` da `CustomList`.
4. THE Backend SHALL garantir que apenas o User proprietario da `CustomList` possa adicionar, remover ou deletar a lista.
5. WHEN um User acessa `GET /me/lists`, THE Backend SHALL retornar todas as `CustomList` do User com nome, imagem de capa e contagem de itens.
6. THE Frontend SHALL exibir as `CustomList` do User como carrossel horizontal de cards com imagem de capa e nome na secao "Listas" da tela de Perfil.

---

### Requirement 14: Sistema de Follow (Seguir Usuarios)

**User Story:** Como User, quero seguir outros usuarios e ver sua atividade no Feed, para que eu descubra conteudo atraves das pessoas que acompanho.

#### Acceptance Criteria

1. WHEN um User envia `POST /users/:userId/follow`, THE Backend SHALL criar um registro `Follow` vinculando o User autenticado como seguidor do `userId` alvo.
2. WHEN um User envia `DELETE /users/:userId/follow`, THE Backend SHALL remover o registro `Follow` correspondente.
3. IF um User tenta seguir a si mesmo, THEN THE Backend SHALL retornar HTTP 422 com mensagem descritiva.
4. THE Backend SHALL garantir unicidade do par `(followerId, followingId)` na tabela `Follow`.
5. WHEN um User acessa `GET /users/:userId/followers` ou `GET /users/:userId/following`, THE Backend SHALL retornar a lista de usuarios com paginacao por cursor.

---

### Requirement 15: Notificacoes

**User Story:** Como User, quero receber notificacoes sobre lancamentos de episodios e atividades relevantes, para que eu seja avisado sem precisar verificar o app constantemente.

#### Acceptance Criteria

1. WHEN um novo Episode de um Show com `UserShowSubscription` `assistindo` e lancado, THE Backend SHALL criar uma `Notification` para o User com tipo `new_episode`, referencia ao Episode e timestamp.
2. WHEN um User acessa `GET /me/notifications`, THE Backend SHALL retornar as `Notification` do User ordenadas por data decrescente, com paginacao por cursor.
3. WHEN um User acessa `POST /me/notifications/:notificationId/read`, THE Backend SHALL marcar a `Notification` como lida.
4. THE Frontend SHALL exibir o icone de sino (`SVG_Icon`) no Perfil com badge numerico indicando a quantidade de notificacoes nao lidas.
5. WHEN todas as notificacoes forem lidas, THE Frontend SHALL remover o badge numerico do icone de sino.

---

### Requirement 16: Frontend Base e Seguranca

**User Story:** Como desenvolvedor, quero um frontend Next.js configurado com autenticacao via cookie seguro, middleware de protecao de rotas e cliente HTTP unico, para que toda a interacao com o Backend seja segura e centralizada.

#### Acceptance Criteria

1. THE Frontend SHALL implementar um `middleware.ts` que verifique o cookie de Access Token antes de renderizar qualquer rota protegida (ex: `/perfil`, `/minha-lista`, `/show/*`); IF o token estiver ausente ou invalido, THEN THE Frontend SHALL redirecionar para `/login`.
2. THE Frontend SHALL implementar `/lib/api.ts` como unico cliente HTTP com interceptador que, ao receber HTTP 401, tenta refresh automatico via `POST /auth/refresh` e reexecuta a requisicao original; IF o refresh falhar, THEN THE Frontend SHALL redirecionar para `/login`.
3. THE Frontend SHALL configurar CSP via `next.config.js` ou `middleware.ts` para bloquear execucao de scripts de origens nao autorizadas.
4. THE Frontend SHALL armazenar tokens exclusivamente em cookies `HttpOnly`; nunca em `localStorage` ou `sessionStorage`.
5. THE Frontend SHALL utilizar apenas variaveis de ambiente com prefixo `NEXT_PUBLIC_` para dados necessarios no cliente; URLs de banco de dados, chaves privadas e tokens de servico nunca deverao ser expostos com `NEXT_PUBLIC_`.

---

### Requirement 17: Icones SVG e Temas Visual

**User Story:** Como desenvolvedor, quero todos os icones do app implementados como SVG proprios, para que o visual seja consistente, acessivel e adaptado ao tema escuro/amarelo do app sem uso de emojis.

#### Acceptance Criteria

1. THE Frontend SHALL implementar cada icone como componente SVG dedicado em `/components/icons/` com nome descritivo: `IconCheck`, `IconStar`, `IconPlay`, `IconChevronDown`, `IconClock`, `IconClapperboard`, `IconBell`, `IconGrid`, `IconList`, `IconSearch`, `IconPlatformDisney`, `IconPlatformAppleTV`, `IconPlatformATX`.
2. THE Frontend SHALL fazer todos os SVG_Icon herdarem cor via `currentColor` ou variavel CSS, nunca cor hexadecimal hardcoded no atributo `fill` ou `stroke`.
3. THE Frontend SHALL nunca utilizar caracteres de emoji em codigo-fonte, componentes, strings de UI, mensagens de log, commits ou documentacao gerada.
4. THE Frontend SHALL implementar o tema visual com fundo escuro (preto/cinza escuro) e cor de destaque amarela, definidos como variaveis CSS globais no `globals.css` ou `:root`.

---

### Requirement 18: Testes Automatizados

**User Story:** Como desenvolvedor, quero cobertura de testes automatizados para as regras de negocio criticas, para que regressoes sejam detectadas antes do deploy.

#### Acceptance Criteria

1. THE Backend SHALL ter testes unitarios Jest cobrindo o caminho feliz e pelo menos um caminho de erro para cada Service critico: `AuthService`, `WatchService`, `ShowsService` e `ListsService`.
2. THE Backend SHALL ter testes de integracao para os endpoints criticos `POST /auth/login`, `POST /episodes/:id/watch` e `GET /me/continue-watching` usando banco de dados isolado (schema de teste separado).
3. WHEN `WatchService.markEpisodeWatched` e chamado com um `episodeId` valido e um `userId` valido, THE WatchService SHALL criar um unico `WatchProgress` mesmo que chamado multiplas vezes (idempotencia).
4. FOR ALL `episodeId` validos, THE WatchService SHALL preservar a contagem total de `WatchProgress` do User ao executar mark seguido de unmark seguido de mark novamente (propriedade round-trip).
5. THE Backend SHALL executar lint, type-check e todos os testes em pipeline de CI antes de aceitar merge na branch principal.

---

### Requirement 19: Observabilidade e Logs

**User Story:** Como operador, quero logs estruturados no backend com sanitizacao de dados sensiveis, para que problemas em producao sejam diagnosticados sem expor PII ou credenciais.

#### Acceptance Criteria

1. THE Backend SHALL utilizar um logger estruturado (`pino` ou `winston`) em todas as operacoes de Service e no `ExceptionFilter` global.
2. THE Backend SHALL mascarar ou omitir campos sensiveis nos logs: senhas, tokens JWT, chaves de API e qualquer dado que constitua PII (email, CPF, numero de telefone).
3. WHEN o `ExceptionFilter` captura um erro, THE Backend SHALL logar o stack trace completo internamente e devolver ao cliente apenas a mensagem sanitizada e o HTTP status code correspondente.
4. THE Backend SHALL incluir um identificador unico de requisicao (`requestId`) em cada log de erro para facilitar rastreabilidade.
