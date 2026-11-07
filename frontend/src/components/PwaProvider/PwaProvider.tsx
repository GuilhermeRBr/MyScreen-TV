'use client';

import { useServiceWorker } from '@/lib/useServiceWorker';

/**
 * Componente client-side responsável apenas por registrar o Service Worker.
 * Não renderiza nenhum elemento visual — é um efeito colateral de montagem.
 *
 * Colocado no RootLayout para que o registro aconteça uma única vez,
 * em qualquer rota da aplicação.
 */
export function PwaProvider() {
  useServiceWorker();
  return null;
}
