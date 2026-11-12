'use client';

import {
  createContext,
  useContext,
  useState,
  useTransition,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { IconPlus, IconCheck, IconDots, IconTrash } from '@/components/icons';
import { ConfirmModal } from '@/components/ConfirmModal/ConfirmModal';
import { api } from '@/lib/api';
import buttonStyles from '@/components/AddToWatchlistButton/AddToWatchlistButton.module.css';
import menuStyles from '@/components/MovieOptionsMenu/MovieOptionsMenu.module.css';

type WatchStatus = 'WATCHLIST' | 'WATCHED' | null;

// --- Contexto compartilhado entre WatchButton e OptionsMenu ---

interface MovieHeaderContextValue {
  movieId: string;
  status: WatchStatus;
  isPending: boolean;
  handleWatchButtonClick: () => void;
  handleRemoveConfirmed: () => void;
}

const MovieHeaderContext = createContext<MovieHeaderContextValue | null>(null);

function useMovieHeader() {
  const ctx = useContext(MovieHeaderContext);
  if (!ctx) throw new Error('Componente fora de MovieHeaderProvider');
  return ctx;
}

// --- Provider ---

async function fetchStatus(movieId: string): Promise<WatchStatus> {
  try {
    const data = await api.get<{ status: WatchStatus }>(
      `/watch/movies/${movieId}/status`,
    );
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

async function toggleWatched(movieId: string): Promise<WatchStatus> {
  try {
    const data = await api.post<{ watched: boolean }>(
      '/watch/movies/toggle',
      { movieId },
    );
    return data.watched ? 'WATCHED' : 'WATCHLIST';
  } catch {
    return null;
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

export function MovieHeaderProvider({
  movieId,
  initialStatus,
  children,
}: {
  movieId: string;
  initialStatus: WatchStatus;
  children: ReactNode;
}) {
  const [status, setStatus] = useState<WatchStatus>(initialStatus);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleWatchButtonClick() {
    if (status === null) {
      startTransition(async () => {
        const ok = await addToWatchlist(movieId);
        if (ok) setStatus('WATCHLIST');
      });
    } else {
      startTransition(async () => {
        const next = await toggleWatched(movieId);
        if (next !== null) setStatus(next);
      });
    }
  }

  function handleRemoveConfirmed() {
    startTransition(async () => {
      const ok = await removeFromList(movieId);
      if (ok) {
        setStatus(null);
        router.refresh();
      }
    });
  }

  return (
    <MovieHeaderContext.Provider
      value={{
        movieId,
        status,
        isPending,
        handleWatchButtonClick,
        handleRemoveConfirmed,
      }}
    >
      {children}
    </MovieHeaderContext.Provider>
  );
}

// --- Botão de assistido / watchlist (canto inferior direito do backdrop) ---

export function MovieWatchButton() {
  const { status, isPending, handleWatchButtonClick } = useMovieHeader();

  const isOnList = status !== null;
  const isWatched = status === 'WATCHED';

  return (
    <button
      className={[
        buttonStyles.roundButton,
        isWatched
          ? buttonStyles.roundButtonWatched
          : isOnList
            ? buttonStyles.roundButtonActive
            : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={handleWatchButtonClick}
      disabled={isPending}
      aria-label={
        isWatched
          ? 'Marcar como não assistido'
          : isOnList
            ? 'Marcar como assistido'
            : 'Adicionar à minha lista'
      }
    >
      {isPending ? (
        <span className={buttonStyles.spinner} aria-hidden="true" />
      ) : isOnList ? (
        <IconCheck width={20} height={20} />
      ) : (
        <IconPlus width={20} height={20} />
      )}
    </button>
  );
}

// --- Menu de 3 pontos (canto superior direito do backdrop) ---

export function MovieOptionsButton() {
  const { status, isPending, handleRemoveConfirmed } = useMovieHeader();
  const [open, setOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const isOnList = status !== null;

  function handleToggleMenu() {
    setOpen((prev) => !prev);
  }

  function handleRemoveClick() {
    setOpen(false);
    setShowConfirm(true);
  }

  function handleCancelRemove() {
    setShowConfirm(false);
  }

  function handleConfirm() {
    setShowConfirm(false);
    handleRemoveConfirmed();
  }

  return (
    <>
      <div className={menuStyles.wrapper}>
        <button
          className={menuStyles.dotsButton}
          onClick={handleToggleMenu}
          aria-label="Mais opções"
          aria-haspopup="menu"
          aria-expanded={open}
          disabled={isPending}
        >
          <IconDots width={20} height={20} />
        </button>

        {open && (
          <>
            {/* Overlay invisível para fechar ao clicar fora */}
            <div
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 49,
              }}
              onClick={() => setOpen(false)}
              aria-hidden="true"
            />
            <div className={menuStyles.menu} role="menu">
              {isOnList ? (
                <button
                  className={`${menuStyles.menuItem} ${menuStyles.menuItemDanger}`}
                  role="menuitem"
                  onClick={handleRemoveClick}
                >
                  <IconTrash width={16} height={16} />
                  <span>Remover da lista</span>
                </button>
              ) : (
                <p className={menuStyles.menuEmpty}>Nenhuma ação disponível.</p>
              )}
            </div>
          </>
        )}
      </div>

      {showConfirm && (
        <ConfirmModal
          title="Remover da lista"
          description="Tem certeza que deseja remover este filme da sua lista?"
          confirmLabel="Remover"
          cancelLabel="Cancelar"
          onConfirm={handleConfirm}
          onCancel={handleCancelRemove}
          isDanger
        />
      )}
    </>
  );
}
