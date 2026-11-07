'use client';

import { useEffect, useState, useTransition } from 'react';
import { IconPlus, IconCheck } from '@/components/icons';
import { api } from '@/lib/api';
import styles from './AddToSubscriptionButton.module.css';

type ShowStatus =
  | 'WATCHING'
  | 'REWATCHING'
  | 'PAUSED'
  | 'STOPPED'
  | 'PLAN_TO_WATCH'
  | 'NOT_WATCHING_FOR_A_WHILE'
  | null;

interface AddToSubscriptionButtonProps {
  showId: string;
  initialStatus: ShowStatus;
}

async function fetchStatus(showId: string): Promise<ShowStatus> {
  try {
    const data = await api.get<{ status: ShowStatus }>(`/watch/shows/${showId}/subscription`);
    return data.status;
  } catch {
    return null;
  }
}

async function subscribe(showId: string): Promise<boolean> {
  try {
    await api.post('/watch/shows/subscribe', { showId, status: 'PLAN_TO_WATCH' });
    return true;
  } catch {
    return false;
  }
}

async function unsubscribe(showId: string): Promise<boolean> {
  try {
    await api.delete(`/watch/shows/${showId}`);
    return true;
  } catch {
    return false;
  }
}

export function AddToSubscriptionButton({
  showId,
  initialStatus,
}: AddToSubscriptionButtonProps) {
  const [status, setStatus] = useState<ShowStatus>(initialStatus);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Revalida o status do servidor ao montar
  useEffect(() => {
    fetchStatus(showId).then(setStatus);
  }, [showId]);

  function handleClick() {
    setError(null);

    if (status !== null) {
      startTransition(async () => {
        const ok = await unsubscribe(showId);
        if (ok) {
          setStatus(null);
        } else {
          setError('Não foi possível remover. Tente novamente.');
        }
      });
    } else {
      startTransition(async () => {
        const ok = await subscribe(showId);
        if (ok) {
          setStatus('PLAN_TO_WATCH');
        } else {
          setError('Não foi possível salvar. Tente novamente.');
        }
      });
    }
  }

  const isSubscribed = status !== null;

  return (
    <div className={styles.wrapper}>
      <button
        className={`${styles.mainButton} ${isSubscribed ? styles.mainButtonActive : ''}`}
        onClick={handleClick}
        disabled={isPending}
        aria-label={isSubscribed ? 'Remover da minha lista' : 'Adicionar à minha lista'}
      >
        {isPending ? (
          <span className={styles.spinner} aria-hidden="true" />
        ) : isSubscribed ? (
          <IconCheck width={18} height={18} />
        ) : (
          <IconPlus width={18} height={18} />
        )}
        <span className={styles.label}>Minha lista</span>
      </button>

      {error && (
        <span className={styles.errorMsg} role="alert">{error}</span>
      )}
    </div>
  );
}
