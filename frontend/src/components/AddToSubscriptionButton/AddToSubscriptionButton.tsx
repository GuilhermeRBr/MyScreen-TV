'use client';

import { useEffect, useState, useTransition } from 'react';
import { IconPlus, IconCheck } from '@/components/icons';
import { ConfirmModal } from '@/components/ConfirmModal/ConfirmModal';
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
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    fetchStatus(showId).then(setStatus);
  }, [showId]);

  function handleClick() {
    if (status !== null) {
      // Série já adicionada — pede confirmação antes de remover
      setShowConfirm(true);
    } else {
      startTransition(async () => {
        const ok = await subscribe(showId);
        if (ok) setStatus('PLAN_TO_WATCH');
      });
    }
  }

  function handleConfirmRemove() {
    setShowConfirm(false);
    startTransition(async () => {
      const ok = await unsubscribe(showId);
      if (ok) setStatus(null);
    });
  }

  function handleCancelRemove() {
    setShowConfirm(false);
  }

  const isSubscribed = status !== null;

  return (
    <>
      <button
        className={`${styles.roundButton} ${isSubscribed ? styles.roundButtonActive : ''}`}
        onClick={handleClick}
        disabled={isPending}
        aria-label={isSubscribed ? 'Remover da minha lista' : 'Adicionar à minha lista'}
      >
        {isPending ? (
          <span className={styles.spinner} aria-hidden="true" />
        ) : isSubscribed ? (
          <IconCheck width={20} height={20} />
        ) : (
          <IconPlus width={20} height={20} />
        )}
      </button>

      {showConfirm && (
        <ConfirmModal
          title="Remover da lista"
          description="Tem certeza que deseja remover esta série da sua lista? O progresso de episódios assistidos será mantido."
          confirmLabel="Remover"
          cancelLabel="Cancelar"
          onConfirm={handleConfirmRemove}
          onCancel={handleCancelRemove}
          isDanger
        />
      )}
    </>
  );
}
