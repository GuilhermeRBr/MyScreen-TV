'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { IconChevronLeft } from '@/components/icons';
import styles from './BackButton.module.css';

interface BackButtonProps {
  fallbackHref?: string;
  label?: string;
}

export function BackButton({
  fallbackHref = '/',
  label = 'Voltar',
}: BackButtonProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from');

  function handleClick() {
    if (from) {
      router.push(from);
    } else if (window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }

    // Força o Next.js a re-renderizar a rota de destino
    // para que Client Components como ProfileSeriesPreview
    // re-busquem dados atualizados do servidor.
    router.refresh();
  }

  return (
    <button
      className={styles.button}
      onClick={handleClick}
      aria-label={label}
      type="button"
    >
      <IconChevronLeft width={24} height={24} />
    </button>
  );
}
