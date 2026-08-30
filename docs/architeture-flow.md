flowchart TD

    User(["Usuário"])

    subgraph FE["FRONTEND — Next.js (App Router)"]
        direction TB
        Page["Página/Componente<br/>(ex: /show/[id]/episodios)"]
        ApiClient["lib/api.ts<br/>cliente HTTP + interceptor"]
        MW["middleware.ts<br/>checa cookie de token"]
        RefreshLogic["Interceptor: token expirado?<br/>chama /auth/refresh"]

        Page -->|"dispara request"| ApiClient
        MW -->|"token ausente/expirado"| Redirect["Redirect → /login"]
        MW -->|"token válido"| Page
        ApiClient -->|"401 recebido"| RefreshLogic
        RefreshLogic -->|"novo token ok"| ApiClient
        RefreshLogic -->|"refresh falhou"| Redirect
    end

    User --> MW

    ApiClient -->|"HTTPS + cookie HttpOnly"| Edge["Edge / Load Balancer<br/>(SSL termination)"]

    subgraph BE["BACKEND — NestJS (pipeline por request)"]
        direction TB
        Helmet["Helmet<br/>(HSTS, X-Frame-Options, etc.)"]
        CORS["CORS<br/>(origin = URL exata do frontend)"]
        Throttler["@nestjs/throttler<br/>(rate limit por IP)"]
        Validation["ValidationPipe global<br/>(whitelist, forbidNonWhitelisted, transform)"]
        Guard["JwtAuthGuard<br/>(valida assinatura RS256/HS256)"]
        RBAC["RolesGuard (RBAC)<br/>(@SetMetadata roles)"]
        Controller["Controller<br/>(shows / movies / watch / lists / feed)"]
        Service["Service<br/>(regra de negócio)"]
        ExFilter["ExceptionFilter global<br/>(sanitiza erro antes de responder)"]

        Helmet --> CORS --> Throttler --> Validation --> Guard
        Guard -->|"token inválido"| Unauthorized["401 Unauthorized"]
        Guard -->|"token válido"| RBAC
        RBAC -->|"sem permissão"| Forbidden["403 Forbidden"]
        RBAC -->|"permitido"| Controller
        Controller --> Service
        Service -->|"erro"| ExFilter
        ExFilter --> ErrResponse["Resposta de erro sanitizada"]
    end

    Edge --> Helmet

    subgraph DB["PRISMA + POSTGRESQL"]
        direction TB
        PrismaService["PrismaService<br/>(query parametrizada)"]
        Pool["Connection Pool<br/>(PgBouncer / limite max)"]
        Postgres[("PostgreSQL<br/>SSL required")]

        PrismaService --> Pool --> Postgres
    end

    Service -->|"Prisma Client"| PrismaService
    Postgres -->|"rows"| PrismaService --> Service
    Service -->|"DTO de resposta"| Controller
    Controller -->|"JSON"| Edge
    Edge -->|"HTTPS"| ApiClient
    ApiClient --> Page
    Page -->|"render"| User

    subgraph Domain["Fluxos de domínio (exemplos via Controller/Service)"]
        direction LR
        F1["GET /shows/:id<br/>→ aba Sobre"]
        F2["GET /shows/:id/episodes<br/>→ temporadas + progresso"]
        F3["POST /episodes/:id/watch<br/>→ toggle assistido"]
        F3a["atualiza WatchProgress"]
        F3b["recalcula stats do usuário<br/>(tempo assistido, contadores)"]
        F4["GET /me/upcoming<br/>→ agrupa episódios/filmes futuros por data"]
        F5["GET /feed?tab=feed|descobrir<br/>→ Explorar"]

        F3 --> F3a --> F3b
    end

    Service -.->|"executa"| F1
    Service -.->|"executa"| F2
    Service -.->|"executa"| F3
    Service -.->|"executa"| F4
    Service -.->|"executa"| F5

    subgraph Auth["Fluxo de autenticação"]
        direction TB
        Login["POST /auth/login"]
        CheckCred["valida credenciais<br/>(hash de senha)"]
        IssueTokens["gera Access Token (curto)<br/>+ Refresh Token (longo)"]
        SetCookie["seta cookies<br/>HttpOnly + Secure + SameSite=Strict"]
        RefreshEndpoint["POST /auth/refresh<br/>valida refresh token → novo access token"]

        Login --> CheckCred
        CheckCred -->|"ok"| IssueTokens --> SetCookie
        CheckCred -->|"inválido"| AuthFail["401"]
        RefreshLogic --> RefreshEndpoint --> IssueTokens
    end

    subgraph CI["CI/CD (GitHub Actions)"]
        direction TB
        Push["git push"]
        Lint["yarn lint + type-check"]
        Test["yarn test"]
        Audit["yarn audit / Dependabot"]
        Build["build Docker (frontend + backend)"]
        SecretMgr["Secret Manager<br/>injeta variáveis de ambiente"]
        Deploy["Deploy (staging/produção)"]

        Push --> Lint --> Test --> Audit --> Build
        SecretMgr --> Build
        Build --> Deploy
    end

    subgraph Hook["Kiro Hook — Lint & Format on Save"]
        direction TB
        SaveEvent["Salvar arquivo .ts/.tsx/.module.css"]
        RunEslint["yarn eslint --fix"]
        RunPrettier["yarn prettier --write"]
        ManualFix["Agente corrige manualmente<br/>se sobrar erro não-autofixável"]

        SaveEvent --> RunEslint --> RunPrettier --> ManualFix
    end

    Push -.->|"código já formatado pelo hook"| Lint

    subgraph Logs["Observabilidade"]
        Logger["pino/winston<br/>logs estruturados"]
        Mask["mascara senha/token/PII"]
        Logger --> Mask
    end

    Service -.->|"log de cada operação"| Logger
    ExFilter -.->|"log de erro"| Logger