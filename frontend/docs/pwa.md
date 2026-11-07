# PWA — MyScreen TV

Documentação técnica da implementação de Progressive Web App do MyScreen TV.

---

## Como funciona

O PWA do MyScreen TV é composto por quatro partes principais:

1. **Web App Manifest** (`/public/manifest.webmanifest`): declara nome, ícones,
   cores e comportamento de instalação para o navegador.

2. **Service Worker** (`/public/sw.js`): intercepta requisições de rede para
   aplicar estratégias de cache por tipo de recurso.

3. **`PwaProvider`** (`/src/components/PwaProvider/PwaProvider.tsx`): componente
   client-side no layout raiz que registra o Service Worker via
   `useServiceWorker`.

4. **`InstallPwaButton`** (`/src/components/InstallPwaButton/`): botão de
   instalação no menu do perfil, com comportamento adaptado por plataforma.

---

## Estratégias de cache

| Tipo de recurso | Estratégia | Detalhes |
|---|---|---|
| Arquivos JS/CSS do Next.js (`/_next/static/`) | Cache-First | Hash no nome garante que nunca mudam; servidos do cache imediatamente. |
| Ícones e manifest (`/icons/`, `/manifest.webmanifest`) | Cache-First | Pré-carregados na instalação do SW. |
| Imagens do TMDB (`image.tmdb.org`) | Stale-While-Revalidate | Serve do cache enquanto atualiza em segundo plano. Limite de 200 entradas, TTL de 7 dias. |
| Navegação HTML (páginas) | Network-First | Sempre busca da rede; cai para `/offline.html` quando sem conexão. |
| API (`/api/*`, `/auth/*`) | Sem cache | Nunca interceptados. Dados privados, tokens e estado dinâmico jamais vão para o Cache Storage. |

---

## Como atualizar o Service Worker

O SW usa versionamento por constante no topo do arquivo:

```js
const CACHE_VERSION = 'v1';
const STATIC_CACHE  = `myscreen-static-${CACHE_VERSION}`;
const IMAGE_CACHE   = `myscreen-images-${CACHE_VERSION}`;
```

Para forçar que todos os clientes recebam o novo SW:

1. Incremente `CACHE_VERSION` (ex: `'v1'` → `'v2'`).
2. Faça o build e deploy normalmente.
3. O navegador detecta o novo `/sw.js`, instala o novo SW em background.
4. Na ativação, o novo SW remove os caches da versão antiga automaticamente.
5. O hook `useServiceWorker` envia `SKIP_WAITING` quando um novo SW aguarda,
   e recarrega a página quando o novo SW assume o controle.

O arquivo `/sw.js` é servido com `Cache-Control: no-cache` para que o navegador
sempre verifique se há uma nova versão.

---

## Experiência offline

Ao abrir o app sem conexão, após ter sido carregado ao menos uma vez:

- O Service Worker intercepta as navegações e serve `/offline.html`.
- A página offline exibe o logo do MyScreen TV, uma mensagem clara e um botão
  "Tentar novamente" que recarrega a página.
- Assets estáticos (JS, CSS, fontes) são servidos do cache, então a interface
  carrega normalmente quando a conexão voltar sem precisar de reload.

Funcionalidades que dependem do backend (listas, progresso, perfil) mostrarão
erros normais da API — o app não exibe dados antigos como se fossem atuais.

---

## Como testar offline

### Via DevTools (recomendado para desenvolvimento)

1. Abra o Chrome DevTools (`F12`).
2. Vá para a aba **Application** > **Service Workers**.
3. Marque **Offline**.
4. Navegue para uma rota qualquer — deve aparecer a página `/offline.html`.
5. Desmarque **Offline** e recarregue — o app volta ao normal.

### Via DevTools — inspecionar o cache

1. **Application** > **Cache Storage**: exibe os caches `myscreen-static-v1`
   e `myscreen-images-v1` com as entradas armazenadas.
2. **Application** > **Service Workers**: exibe o status do SW registrado.

### Via Lighthouse

1. Abra o Chrome DevTools > **Lighthouse**.
2. Marque a categoria **Progressive Web App**.
3. Execute o audit.
4. Os critérios de instalabilidade, manifest e SW devem estar verdes em produção
   (requer HTTPS).

---

## Como instalar

### Android (Chrome, Edge, Samsung Internet)

O navegador exibe automaticamente o banner de instalação quando os critérios de
PWA são atendidos, ou o usuário pode instalar via menu do navegador
("Adicionar à tela inicial").

O botão **Instalar MyScreen TV** aparece no menu do perfil (ícone de três pontos)
quando o evento `beforeinstallprompt` está disponível.

### iOS (Safari)

O iOS não suporta o evento `beforeinstallprompt`. Para instalar:

1. Abra o MyScreen TV no **Safari** (outros navegadores no iOS não suportam PWA
   com todas as funcionalidades).
2. Toque no ícone de **Compartilhar** na barra inferior.
3. Toque em **Adicionar à Tela de Início**.
4. Confirme tocando em **Adicionar**.

O botão **Instalar MyScreen TV** no menu do perfil detecta iOS automaticamente
e exibe essas instruções passo a passo.

### Windows / macOS (Chrome, Edge)

O navegador exibe o ícone de instalação na barra de endereços, ou o botão
**Instalar MyScreen TV** aparece no menu do perfil.

---

## Limitações por plataforma

| Plataforma | Limitação |
|---|---|
| iOS | Sem `beforeinstallprompt`; instalação apenas via Safari > "Adicionar à Tela de Início". Push notifications não suportadas em iOS < 16.4. |
| iOS < 16.4 | Service Worker presente mas Push API indisponível. |
| Firefox | `beforeinstallprompt` não suportado; instalação via menu do navegador. |
| Safari macOS | Suporte limitado a Service Workers; instalação disponível a partir do Safari 17. |

---

## Notificações push — implementação futura

A arquitetura está preparada para integrar Web Push com VAPID. Requisitos para
uma futura implementação:

**Backend (NestJS):**
- Gerar par de chaves VAPID: `npx web-push generate-vapid-keys`.
- Armazenar `VAPID_PUBLIC_KEY` e `VAPID_PRIVATE_KEY` como secrets de ambiente.
- Criar endpoint `POST /notifications/subscribe` para receber e armazenar
  `PushSubscription` por usuário (modelo `PushSubscription` no Prisma).
- Criar endpoint `POST /notifications/send` (admin) ou disparar a partir de
  eventos de negócio (novo episódio, lembrete).
- Instalar `web-push`: `yarn add web-push` + `yarn add -D @types/web-push`.

**Frontend:**
- Solicitar permissão apenas mediante ação explícita do usuário (nunca
  automaticamente no carregamento).
- Criar hook `useNotificationPermission` para gerenciar o estado da permissão.
- No SW, implementar o handler `push` para exibir a notificação via
  `self.registration.showNotification(...)`.
- Nunca armazenar o payload da notificação no Cache Storage.

**Segurança:**
- A chave VAPID pública pode ser exposta via `NEXT_PUBLIC_VAPID_PUBLIC_KEY`.
- A chave privada jamais deve sair do backend.

---

## Arquivos criados/modificados

| Arquivo | Tipo | Descrição |
|---|---|---|
| `public/manifest.webmanifest` | Criado | Web App Manifest |
| `public/sw.js` | Criado | Service Worker |
| `public/offline.html` | Criado | Página de fallback offline |
| `public/icons/icon-192.svg` | Criado | Ícone PWA 192x192 |
| `public/icons/icon-512.svg` | Criado | Ícone PWA 512x512 |
| `public/icons/icon-maskable-512.svg` | Criado | Ícone maskable 512x512 (fundo vermelho sólido) |
| `src/app/layout.tsx` | Modificado | Metadados PWA, viewport, manifest, `PwaProvider` |
| `src/lib/usePwaInstall.ts` | Criado | Hook de detecção e prompt de instalação |
| `src/lib/useServiceWorker.ts` | Criado | Hook de registro do Service Worker |
| `src/components/PwaProvider/PwaProvider.tsx` | Criado | Componente que registra o SW no layout raiz |
| `src/components/InstallPwaButton/InstallPwaButton.tsx` | Criado | Botão de instalação com guia iOS |
| `src/components/InstallPwaButton/InstallPwaButton.module.css` | Criado | Estilos do botão e modal iOS |
| `src/components/ProfileMenu/ProfileMenu.tsx` | Modificado | Inclui `InstallPwaButton` no menu |
| `src/middleware.ts` | Modificado | Exclui `sw.js`, `manifest.webmanifest` e `offline.html` do matcher |
| `next.config.js` | Modificado | CSP `worker-src`, cabeçalhos para SW e manifest |
| `docs/pwa.md` | Criado | Esta documentação |
