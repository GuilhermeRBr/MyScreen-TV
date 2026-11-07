/**
 * Service Worker — MyScreen TV
 * Estratégias de cache por tipo de recurso:
 *
 * - Shell estático (HTML, CSS, JS do Next.js, fontes):
 *     Cache-First com fallback para rede. Esses arquivos raramente mudam
 *     entre sessões — servir do cache primeiro é o mais rápido.
 *
 * - Imagens do TMDB (image.tmdb.org):
 *     Stale-While-Revalidate com limite de entradas e TTL de 7 dias.
 *     Serve o que tem em cache enquanto atualiza em segundo plano.
 *
 * - Requisições de API (/api/*):
 *     Nunca armazenadas em cache. Contêm dados privados de usuário,
 *     tokens e estado dinâmico — cache aqui seria um risco de segurança
 *     e apresentaria dados desatualizados como se fossem atuais.
 *
 * - Navegação (HTML de páginas):
 *     Network-First com fallback para /offline.html quando offline.
 *
 * Segurança:
 *   - Nenhum endpoint de autenticação é interceptado para cache.
 *   - Nenhum cookie ou token é lido ou armazenado pelo SW.
 *   - Cache Storage nunca recebe respostas de /api/*.
 */

const CACHE_VERSION = 'v1';
const STATIC_CACHE = `myscreen-static-${CACHE_VERSION}`;
const IMAGE_CACHE = `myscreen-images-${CACHE_VERSION}`;

/** Recursos estáticos essenciais para o shell da aplicação. */
const STATIC_PRECACHE_URLS = [
  '/offline.html',
  '/manifest.webmanifest',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg',
  '/icons/icon-maskable-512.svg',
];

/** Número máximo de imagens do TMDB armazenadas no cache. */
const IMAGE_CACHE_MAX_ENTRIES = 200;

/** TTL em milissegundos para imagens do TMDB (7 dias). */
const IMAGE_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// Instalação: pré-carrega o shell mínimo
// ---------------------------------------------------------------------------

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

// ---------------------------------------------------------------------------
// Ativação: remove caches de versões antigas
// ---------------------------------------------------------------------------

self.addEventListener('activate', (event) => {
  const allowedCaches = [STATIC_CACHE, IMAGE_CACHE];

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((name) => !allowedCaches.includes(name))
            .map((name) => caches.delete(name)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// ---------------------------------------------------------------------------
// Fetch: roteamento por tipo de recurso
// ---------------------------------------------------------------------------

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignora requisições que não sejam HTTP/HTTPS
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Ignora requisições de extensões do navegador
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  // --- API e autenticação: nunca armazenar em cache ---
  if (isApiRequest(url)) {
    // Passa direto para a rede sem nenhuma interceptação de cache.
    // Não há event.respondWith — o browser lida normalmente.
    return;
  }

  // --- Imagens do TMDB: Stale-While-Revalidate ---
  if (isTmdbImage(url)) {
    event.respondWith(staleWhileRevalidate(request, IMAGE_CACHE));
    return;
  }

  // --- Recursos estáticos do Next.js (JS, CSS, fontes): Cache-First ---
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // --- Navegação HTML: Network-First com fallback offline ---
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstWithOfflineFallback(request));
    return;
  }

  // Qualquer outro recurso: passa direto para a rede
});

// ---------------------------------------------------------------------------
// Predicados de roteamento
// ---------------------------------------------------------------------------

/**
 * Retorna true para requisições que vão para a API do backend.
 * Inclui o proxy Next.js (/api/) e endpoints de auth — jamais cacheados.
 */
function isApiRequest(url) {
  return (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/auth/') ||
    url.hostname === 'localhost' && url.port === '3001'
  );
}

/**
 * Retorna true para imagens do TMDB.
 */
function isTmdbImage(url) {
  return url.hostname === 'image.tmdb.org';
}

/**
 * Retorna true para assets estáticos gerados pelo Next.js.
 * Esses arquivos têm hash no nome e nunca mudam após o build.
 */
function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname === '/manifest.webmanifest' ||
    // Fontes do Google (Inter) que o Next.js pode hospedar localmente
    url.pathname.includes('/fonts/')
  );
}

// ---------------------------------------------------------------------------
// Estratégias de cache
// ---------------------------------------------------------------------------

/**
 * Cache-First: serve do cache se disponível; caso contrário, busca na rede
 * e armazena no cache para uso futuro.
 */
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  if (cached) {
    return cached;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    // Sem cache e sem rede — não há como responder
    return new Response('Recurso indisponível offline', {
      status: 503,
      statusText: 'Service Unavailable',
    });
  }
}

/**
 * Stale-While-Revalidate: serve do cache imediatamente enquanto atualiza
 * em segundo plano. Aplica limite de entradas e TTL para imagens.
 */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  // Atualiza em background independente de ter cache ou não
  const networkFetch = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
        pruneImageCache(cache);
      }
      return networkResponse;
    })
    .catch(() => null);

  // Se tem cache, serve imediatamente (não aguarda a rede)
  if (cached) {
    // Verifica TTL da entrada em cache
    const cachedDate = cached.headers.get('sw-cached-at');
    if (cachedDate) {
      const age = Date.now() - parseInt(cachedDate, 10);
      if (age > IMAGE_CACHE_TTL_MS) {
        // Expirou — aguarda a rede
        const fresh = await networkFetch;
        return fresh ?? cached;
      }
    }
    return cached;
  }

  // Sem cache — aguarda a rede
  const fresh = await networkFetch;
  if (fresh) return fresh;

  return new Response('Imagem indisponível offline', {
    status: 503,
    statusText: 'Service Unavailable',
  });
}

/**
 * Network-First com fallback para /offline.html em navegações.
 * Nunca armazena a resposta HTML da rede no cache (evita páginas privadas
 * ficarem em cache).
 */
async function networkFirstWithOfflineFallback(request) {
  try {
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch {
    // Sem conexão: serve a página offline
    const cache = await caches.open(STATIC_CACHE);
    const offlinePage = await cache.match('/offline.html');
    return (
      offlinePage ??
      new Response('<h1>Sem conexão</h1>', {
        status: 503,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      })
    );
  }
}

// ---------------------------------------------------------------------------
// Manutenção do cache de imagens
// ---------------------------------------------------------------------------

/**
 * Remove entradas mais antigas quando o cache de imagens ultrapassa o limite.
 * Execução assíncrona sem bloquear a resposta.
 */
async function pruneImageCache(cache) {
  const keys = await cache.keys();
  if (keys.length > IMAGE_CACHE_MAX_ENTRIES) {
    const toDelete = keys.slice(0, keys.length - IMAGE_CACHE_MAX_ENTRIES);
    await Promise.all(toDelete.map((key) => cache.delete(key)));
  }
}

// ---------------------------------------------------------------------------
// Mensagens recebidas do cliente
// ---------------------------------------------------------------------------

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
