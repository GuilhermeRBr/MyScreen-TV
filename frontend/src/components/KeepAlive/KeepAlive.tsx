'use client';

import { useEffect } from 'react';

// Intervalo entre pings: 10 minutos.
// O Render hiberna após ~15 minutos sem requisições; pingar a cada 10
// garante que o servidor esteja acordado quando o usuário precisar.
const PING_INTERVAL_MS = 10 * 60 * 1000;

/**
 * Componente invisível que mantém o backend acordado enviando pings
 * periódicos via a rota interna /api/keepalive.
 *
 * Deve ser incluído apenas uma vez, no layout raiz, fora de Suspense.
 */
export function KeepAlive() {
  useEffect(() => {
    // Não pingar em desenvolvimento para não gerar ruído nos logs
    if (process.env.NODE_ENV !== 'production') {
      return;
    }

    async function ping() {
      try {
        await fetch('/api/keepalive', { method: 'GET' });
      } catch {
        // Falha silenciosa — keep-alive é melhor-esforço
      }
    }

    // Pinga imediatamente ao montar (quando o usuário abre o app)
    void ping();

    const interval = setInterval(ping, PING_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  return null;
}
