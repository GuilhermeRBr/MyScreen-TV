'use client';

import { useEffect } from 'react';
import styles from './WatchedEpisodeModal.module.css';

interface WatchedEpisodeModalProps {
  rewatchCount: number;
  onUnwatch: () => void;
  onRewatch: () => void;
  onRewatchDecrement: () => void;
  onCancel: () => void;
}

export function WatchedEpisodeModal({
  rewatchCount,
  onUnwatch,
  onRewatch,
  onRewatchDecrement,
  onCancel,
}: WatchedEpisodeModalProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  const vezes = rewatchCount + 1;
  const descricao =
    vezes === 1
      ? 'Você assistiu este episódio 1 vez.'
      : `Você assistiu este episódio ${vezes} vezes.`;

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="watched-modal-title"
      aria-describedby="watched-modal-desc"
    >
      <div className={styles.backdrop} onClick={onCancel} aria-hidden="true" />

      <div className={styles.sheet}>
        <p className={styles.title} id="watched-modal-title">
          Este episódio já foi assistido
        </p>
        <p className={styles.description} id="watched-modal-desc">
          {descricao}
        </p>

        <div className={styles.actions}>
          <button className={styles.btnRewatch} onClick={onRewatch}>
            Reassistir
          </button>
          {rewatchCount > 0 && (
            <button className={styles.btnRewatchDecrement} onClick={onRewatchDecrement}>
              Reassistir -1
            </button>
          )}
          <button className={styles.btnUnwatch} onClick={onUnwatch}>
            Marcar como não assistido
          </button>
          <button className={styles.btnCancel} onClick={onCancel}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
