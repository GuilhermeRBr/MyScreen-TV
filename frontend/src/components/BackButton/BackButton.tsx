'use client';

import { useRouter } from 'next/navigation';
import { IconChevronLeft } from '@/components/icons';
import styles from './BackButton.module.css';

interface BackButtonProps {
  fallbackHref?: string;
  from?: string | null;
  label?: string;
}

export function BackButton({
  fallbackHref = '/',
  from,
  label = 'Voltar',
}: BackButtonProps) {
  const router = useRouter();

  function handleClick() {
    if (from) {
      router.push(from);
    } else if (window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
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
