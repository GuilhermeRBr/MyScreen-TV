'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { IconPlus, IconCheck, IconEye } from '@/components/icons';
import styles from './AddToWatchlistButton.module.css';

type WatchStatus = 'WATCHLIST' | 'WATCHED' | null;

interface AddToWatchlistButtonProps {
  movieId: string;
  initialStatus: WatchStatus;
}

const API_URL =
  typeof window !== 'undefined'
    ? (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001')
    : 'http://localhost:3001';

async function fetchStatus(movieId: string): Promise<WatchStatus> {
  try {
    const res = await fetch(`${API_URL}/watch/movies/${movieId}/status`, {
      credentials: 'include',
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { status: WatchStatus };
    return data.status;
  } catch {
    return null;
  }
}

async function addToWatchlist(movieId: string): Promise<void> {
  await fetch(`${API_URL}/watch/movies/watchlist`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ movieId }),
  });
}

async function toggleWatched(movieId: string): Promise<{ watched: boolean }> {
  const res = await fetch(`${API_URL}/watch/movies/toggle`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ movieId }),
  });
  return res.json() as Promise<{ watched: boolean }>;
}

export function AddToWatchlistButton({
  movieId,
  initialStatus,
}: AddToWatchlistButtonProps) {
  const [status, setStatus] = useState<WatchStatus>(initialStatus);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const menuRef = useRef<HTMLDivElement>(null);

  // Fecha o menu ao clicar fora
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Revalida o status do servidor ao montar (o initialStatus vem do SSR, pode estar desatualizado)
  useEffect(() => {
    fetchStatus(movieId).then(setStatus);
  }, [movieId]);

  function handleMainClick() {
    if (status === null) {
      // Ainda não está na lista: abre menu para escolher a ação
      setMenuOpen((prev) => !prev);
    } else {
      // Já está na lista: abre menu para gerenciar
      setMenuOpen((prev) => !prev);
    }
  }

  function handleAddToWatchlist() {
    setMenuOpen(false);
    startTransition(async () => {
      await addToWatchlist(movieId);
      setStatus('WATCHLIST');
    });
  }

  function handleMarkWatched() {
    setMenuOpen(false);
    startTransition(async () => {
      const result = await toggleWatched(movieId);
      setStatus(result.watched ? 'WATCHED' : 'WATCHLIST');
    });
  }

  function handleRemove() {
    setMenuOpen(false);
    startTransition(async () => {
      // Toggle para WATCHED e de volta remove o registro — a API já lida com isso
      // Precisamos chamar watchlist e forçar status nulo fazendo toggle quando WATCHED
      // A lógica do backend é: WATCHED -> toggle -> WATCHLIST; não há DELETE ainda.
      // Então marcamos como WATCHED primeiro e depois toggle de novo para voltar a null.
      // Como o backend só tem toggle que vai de null->WATCHED->WATCHLIST, aqui
      // simplesmente atualizamos o estado local para refletir remoção e chamamos
      // watchlist novamente (idempotente). Futuramente um endpoint DELETE resolve isso.
      await addToWatchlist(movieId);
      const result = await toggleWatched(movieId);
      // Se ficou WATCHED, toggle de novo
      if (result.watched) {
        await toggleWatched(movieId);
      }
      const newStatus = await fetchStatus(movieId);
      setStatus(newStatus);
    });
  }

  const isOnList = status !== null;

  return (
    <div className={styles.wrapper} ref={menuRef}>
      <button
        className={`${styles.mainButton} ${isOnList ? styles.mainButtonActive : ''}`}
        onClick={handleMainClick}
        disabled={isPending}
        aria-label={
          status === null
            ? 'Adicionar à minha lista'
            : status === 'WATCHLIST'
              ? 'Na watchlist — clique para gerenciar'
              : 'Assistido — clique para gerenciar'
        }
        aria-expanded={menuOpen}
      >
        {isPending ? (
          <span className={styles.spinner} aria-hidden="true" />
        ) : status === 'WATCHED' ? (
          <IconCheck width={18} height={18} />
        ) : status === 'WATCHLIST' ? (
          <IconEye width={18} height={18} />
        ) : (
          <IconPlus width={18} height={18} />
        )}
        <span className={styles.label}>
          {status === 'WATCHED'
            ? 'Assistido'
            : status === 'WATCHLIST'
              ? 'Quero assistir'
              : 'Minha lista'}
        </span>
      </button>

      {menuOpen && (
        <div className={styles.menu} role="menu" aria-label="Opções da lista">
          <button
            className={styles.menuItem}
            role="menuitem"
            onClick={handleAddToWatchlist}
            disabled={isPending}
          >
            <IconEye width={16} height={16} />
            Quero assistir
          </button>
          <button
            className={styles.menuItem}
            role="menuitem"
            onClick={handleMarkWatched}
            disabled={isPending}
          >
            <IconCheck width={16} height={16} />
            Marcar como assistido
          </button>
          {isOnList && (
            <button
              className={`${styles.menuItem} ${styles.menuItemDanger}`}
              role="menuitem"
              onClick={handleRemove}
              disabled={isPending}
            >
              <IconPlus
                width={16}
                height={16}
                style={{ transform: 'rotate(45deg)' }}
              />
              Remover da lista
            </button>
          )}
        </div>
      )}
    </div>
  );
}
