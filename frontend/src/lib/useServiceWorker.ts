'use client';

import { useEffect } from 'react';

/**
 * Registra o Service Worker e gerencia atualizações silenciosas.
 *
 * - Registra /sw.js apenas em produção (NODE_ENV === 'production') e quando
 *   o navegador suporta Service Workers.
 * - Em desenvolvimento, o SW não é registrado para não interferir com
 *   o hot reload do Next.js.
 * - Quando uma nova versão do SW aguarda ativação, envia a mensagem
 *   SKIP_WAITING para que ele assuma imediatamente ao fechar todas as abas.
 */
export function useServiceWorker(): void {
  useEffect(() => {
    // Service Workers exigem HTTPS — em desenvolvimento não registramos
    // para não conflitar com o dev server do Next.js
    if (
      typeof window === 'undefined' ||
      !('serviceWorker' in navigator) ||
      process.env.NODE_ENV !== 'production'
    ) {
      return;
    }

    let registration: ServiceWorkerRegistration | undefined;

    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) => {
        registration = reg;

        // Verifica periodicamente por atualizações (a cada 60 min)
        const interval = setInterval(() => {
          reg.update().catch(() => {
            // Falha silenciosa — não interrompe o usuário
          });
        }, 60 * 60 * 1000);

        // Quando um novo SW aguarda, ativa-o imediatamente
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (
              newWorker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              // Nova versão disponível — ativa silenciosamente
              newWorker.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        });

        return () => clearInterval(interval);
      })
      .catch(() => {
        // Registro falhou (ex: contexto sem HTTPS, SW com erro de sintaxe)
        // Falha silenciosa — o app funciona normalmente sem SW
      });

    // Quando o SW controller muda (novo SW ativado), recarrega a página
    // para que o usuário receba a versão mais recente
    const handleControllerChange = () => {
      if (registration?.waiting) return;
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener(
      'controllerchange',
      handleControllerChange,
    );

    return () => {
      navigator.serviceWorker.removeEventListener(
        'controllerchange',
        handleControllerChange,
      );
    };
  }, []);
}
