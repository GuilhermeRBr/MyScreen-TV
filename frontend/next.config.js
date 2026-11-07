/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV === 'development';

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
        pathname: '/t/p/**',
      },
    ],
  },
  async headers() {
    // Em dev, NEXT_PUBLIC_API_URL pode não estar disponível no contexto do next.config.js.
    // Usamos uma lista explícita para garantir que a CSP nunca seja "connect-src 'self' undefined".
    const backendUrl =
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    // react-refresh (hot reload) do Next.js exige 'unsafe-eval' em desenvolvimento.
    // Em produção isso é removido para manter a CSP restritiva.
    const scriptSrc = isDev
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
      : "script-src 'self' 'unsafe-inline'";

    // Em dev o webpack se conecta via WebSocket para hot reload e o browser
    // ainda chama o backend diretamente (sem proxy local).
    // O ws:// inclui tanto localhost quanto o IP de rede local para permitir
    // acesso via celular/dispositivos na mesma rede Wi-Fi.
    // Em produção o browser só fala com a própria origem (/api/...) — o proxy
    // Next.js repassa ao backend internamente.
    const frontendHost = process.env.NEXT_PUBLIC_API_URL
      ? new URL(process.env.NEXT_PUBLIC_API_URL).hostname
      : 'localhost';
    const wsOrigins = `ws://localhost:3000 ws://${frontendHost}:3000`;
    const connectSrc = isDev
      ? `connect-src 'self' ${backendUrl} http://localhost:3001 ${wsOrigins}`
      : `connect-src 'self'`;

    // worker-src 'self': permite que o Service Worker (/sw.js) seja registrado
    // a partir da própria origem. Sem essa diretiva a CSP bloquearia o SW.
    const workerSrc = "worker-src 'self'";

    return [
      {
        // Manifesto: serve com o Content-Type correto para todos os navegadores
        source: '/manifest.webmanifest',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
        ],
      },
      {
        // Service Worker: garante que o SW seja servido do escopo correto
        source: '/sw.js',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
          {
            // SW não deve ser cacheado por proxies — o browser gerencia isso
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              scriptSrc,
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' https://image.tmdb.org data: blob:",
              "font-src 'self'",
              connectSrc,
              workerSrc,
              // Permite incorporar iframes do YouTube Privacy-Enhanced Mode
              "frame-src https://www.youtube-nocookie.com",
              "frame-ancestors 'none'",
            ].join('; '),
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
