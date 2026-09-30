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
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    // react-refresh (hot reload) do Next.js exige 'unsafe-eval' em desenvolvimento.
    // Em produção isso é removido para manter a CSP restritiva.
    const scriptSrc = isDev
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
      : "script-src 'self' 'unsafe-inline'";

    // Em dev o webpack se conecta via WebSocket para hot reload.
    const connectSrc = isDev
      ? `connect-src 'self' ${backendUrl} ws://localhost:3000`
      : `connect-src 'self' ${backendUrl}`;

    return [
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
