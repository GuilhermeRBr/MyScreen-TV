'use client';

import { useEffect, useState, useTransition } from 'react';
import { IconPlus, IconCheck } from '@/components/icons';
import { ConfirmModal } from '@/components/ConfirmModal/ConfirmModal';
import { api } from '@/lib/api';
import styles from './AddToWatchlistButton.module.css';

type WatchStatus = 'WATCHLIST' | 'WATCHED' | null;

interface AddToWatchlistButtonProps {
  movieId: string;
  initialStatus: WatchStatus;
}

async function fetchStatus(movieId: string): Promise<WatchStatus> {
  try {
    const data = await api.get<{ status: WatchStatus }>(`/watch/movies/${movieId}/status`);
    return data.status;
  } catch {
    return null;
  }
}

async function addToWatchlist(movieId: string): Promise<boolean> {
  try {
    await api.post('/watch/movies/watchlist', { movieId });
    return true;
  } catch {
    return false;
  }
}

async function removeFromList(movieId: string): Promise<boolean> {
  try {
    await api.delete(`/watch/movies/${movieId}`);
    return true;
  } catch {
    return false;
  }
}

export function AddToWatchlistButton({
  movieId,
  initialStatus,
}: AddToWatchlistButtonProps) {
  const [status, setStatus] = useState<WatchStatus>(initialStatus);
  const [isPending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    fetchStatus(movieId).then(setStatus);
  }, [movieId]);

  function handleClick() {
    if (status !== null) {
      setShowConfirm(true);
    } else {
      startTransition(async () => {
        const ok = await addToWatchlist(movieId);
        if (ok) setStatus('WATCHLIST');
      });
    }
  }

  function handleConfirmRemove() {
    setShowConfirm(false);
    startTransition(async () => {
      const ok = await removeFromList(movieId);
      if (ok) setStatus(null);
    });
  }

  function handleCancelRemove() {
    setShowConfirm(false);
  }

  const isOnList = status !== null;

  return (
    <>
      <button
        className={`${styles.roundButton} ${isOnList ? styles.roundButtonActive : ''}`}
        onClick={handleClick}
        disabled={isPending}
        aria-label={isOnList ? 'Remover da minha lista' : 'Adicionar à minha lista'}
      >
        {isPending ? (
          <span className={styles.spinner} aria-hidden="true" />
        ) : isOnList ? (
          <IconCheck width={20} height={20} />
        ) : (
          <IconPlus width={20} height={20} />
        )}
      </button>

      {showConfirm && (
        <ConfirmModal
          title="Remover da lista"
          description="Tem certeza que deseja remover este filme da sua lista?"
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
