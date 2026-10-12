'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { IconPlus, IconCheck, IconEye } from '@/components/icons';
import styles from './AddToSubscriptionButton.module.css';

type ShowStatus =
  | 'WATCHING'
  | 'REWATCHING'
  | 'PAUSED'
  | 'STOPPED'
  | 'PLAN_TO_WATCH'
  | 'NOT_WATCHING_FOR_A_WHILE'
  | null;

const STATUS_LABEL: Record<NonNullable<ShowStatus>, string> = {
  WATCHING: 'Assistindo',
  REWATCHING: 'Revendo',
  PAUSED: 'Pausado',
  STOPPED: 'Parado',
  PLAN_TO_WATCH: 'Quero assistir',
  NOT_WATCHING_FOR_A_WHILE: 'Em pausa longa',
};

const MENU_OPTIONS: Array<{ value: NonNullable<ShowStatus>; label: string }> = [
  { value: 'WATCHING', label: 'Assistindo' },
  { value: 'PLAN_TO_WATCH', label: 'Quero assistir' },
  { value: 'REWATCHING', label: 'Revendo' },
  { value: 'PAUSED', label: 'Pausado' },
  { value: 'STOPPED', label: 'Parado' },
  { value: 'NOT_WATCHING_FOR_A_WHILE', label: 'Em pausa longa' },
];

interface AddToSubscriptionButtonProps {
  showId: string;
  initialStatus: ShowStatus;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

async function fetchStatus(showId: string): Promise<ShowStatus> {
  try {
    const res = await fetch(`${API_URL}/watch/shows/${showId}/subscription`, {
      credentials: 'include',
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { status: ShowStatus };
    return data.status;
  } catch {
    return null;
  }
}

async function subscribe(showId: string, status: NonNullable<ShowStatus>): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/watch/shows/subscribe`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ showId, status }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function unsubscribe(showId: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/watch/shows/${showId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function AddToSubscriptionButton({
  showId,
  initialStatus,
}: AddToSubscriptionButtonProps) {
  const [status, setStatus] = useState<ShowStatus>(initialStatus);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Revalida o status do servidor ao montar
  useEffect(() => {
    fetchStatus(showId).then(setStatus);
  }, [showId]);

  function handleSubscribe(newStatus: NonNullable<ShowStatus>) {
    setMenuOpen(false);
    setError(null);
    startTransition(async () => {
      const ok = await subscribe(showId, newStatus);
      if (ok) {
        setStatus(newStatus);
      } else {
        setError('Não foi possível salvar. Tente novamente.');
      }
    });
  }

  function handleRemove() {
    setMenuOpen(false);
    setError(null);
    startTransition(async () => {
      const ok = await unsubscribe(showId);
      if (ok) {
        setStatus(null);
      } else {
        setError('Não foi possível remover. Tente novamente.');
      }
    });
  }

  const isSubscribed = status !== null;
  const buttonLabel = status ? STATUS_LABEL[status] : 'Minha lista';

  return (
    <div className={styles.wrapper} ref={menuRef}>
      <button
        className={`${styles.mainButton} ${isSubscribed ? styles.mainButtonActive : ''}`}
        onClick={() => setMenuOpen((prev) => !prev)}
        disabled={isPending}
        aria-label={isSubscribed ? `${buttonLabel} — clique para gerenciar` : 'Adicionar à minha lista'}
        aria-expanded={menuOpen}
      >
        {isPending ? (
          <span className={styles.spinner} aria-hidden="true" />
        ) : isSubscribed ? (
          <IconCheck width={18} height={18} />
        ) : (
          <IconPlus width={18} height={18} />
        )}
        <span className={styles.label}>{buttonLabel}</span>
      </button>

      {error && (
        <span className={styles.errorMsg} role="alert">{error}</span>
      )}

      {menuOpen && (
        <div className={styles.menu} role="menu" aria-label="Opções de acompanhamento">
          {MENU_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`${styles.menuItem} ${status === opt.value ? styles.menuItemActive : ''}`}
              role="menuitem"
              onClick={() => handleSubscribe(opt.value)}
              disabled={isPending}
            >
              {status === opt.value ? (
                <IconCheck width={16} height={16} />
              ) : (
                <IconEye width={16} height={16} />
              )}
              {opt.label}
            </button>
          ))}

          {isSubscribed && (
            <button
              className={`${styles.menuItem} ${styles.menuItemDanger}`}
              role="menuitem"
              onClick={handleRemove}
              disabled={isPending}
            >
              <IconPlus width={16} height={16} style={{ transform: 'rotate(45deg)' }} />
              Remover da lista
            </button>
          )}
        </div>
      )}
    </div>
  );
}
