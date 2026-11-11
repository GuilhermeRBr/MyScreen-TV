'use client';

import { useEffect, useRef } from 'react';

/**
 * Restaura a posição de scroll salva no sessionStorage quando o conteúdo
 * estiver pronto.
 *
 * O salvamento deve ser feito via `saveScrollPosition(key)` no onClick dos
 * cards — antes da navegação — porque o Next.js App Router reseta o scroll
 * durante a transição de rota.
 *
 * @param key   Chave única por página (ex: 'scroll:series').
 * @param ready Sinal de que o conteúdo já foi renderizado.
 */
export function useScrollRestoration(key: string, ready: boolean) {
  const keyRef = useRef(key);
  keyRef.current = key;

  const restoredRef = useRef(false);

  useEffect(() => {
    if (!ready) return;
    if (restoredRef.current) return;

    const saved = sessionStorage.getItem(keyRef.current);
    if (!saved) return;

    const y = Number(saved);
    if (!Number.isFinite(y) || y <= 0) return;

    restoredRef.current = true;

    // setTimeout de 80ms é mais confiável que rAF para aguardar o layout
    // estabilizar depois que imagens de poster são dimensionadas
    const timer = setTimeout(() => {
      window.scrollTo({ top: y, behavior: 'instant' });
    }, 80);

    return () => clearTimeout(timer);
  }, [ready]);
}

/**
 * Salva a posição de scroll atual no sessionStorage.
 * Chame no onClick dos cards, antes da navegação.
 */
export function saveScrollPosition(key: string) {
  sessionStorage.setItem(key, String(window.scrollY));
}
