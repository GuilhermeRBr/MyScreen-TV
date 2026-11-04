'use client';

import styles from './ConfirmMarkPreviousModal.module.css';

interface Props {
  onConfirm: () => void;
  onDecline: () => void;
}

export function ConfirmMarkPreviousModal({ onConfirm, onDecline }: Props) {
  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className={styles.sheet}>
        <p id="modal-title" className={styles.title}>
          Deseja marcar os episódios anteriores como assistidos?
        </p>
        <div className={styles.actions}>
          <button className={styles.btnConfirm} onClick={onConfirm}>
            Sim, marcar todos
          </button>
          <button className={styles.btnDecline} onClick={onDecline}>
            Não
          </button>
        </div>
      </div>
    </div>
  );
}
