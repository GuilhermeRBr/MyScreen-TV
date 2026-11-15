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
import { WatchedEpisodeModal } from '@/components/WatchedEpisodeModal/WatchedEpisodeModal';
import { api } from '@/lib/api';
import buttonStyles from '@/components/AddToWatchlistButton/AddToWatchlistButton.module.css';
import menuStyles from '@/components/MovieOptionsMenu/MovieOptionsMenu.module.css';

type WatchStatus = 'WATCHLIST' | 'WATCHED' | null;

// --- Contexto compartilhado entre WatchButton e OptionsMenu ---

interface MovieHeaderContextValue {
  movieId: string;
  status: WatchStatus;
  rewatchCount: number;
  isPending: boolean;
  handleWatchButtonClick: () => void;
  handleRemoveConfirmed: () => void;
  handleUnwatch: () => void;
  handleRewatch: () => void;
  handleRewatchDecrement: () => void;
}

const MovieHeaderContext = createContext<MovieHeaderContextValue | null>(null);

function useMovieHeader() {
  const ctx = useContext(MovieHeaderContext);
  if (!ctx) throw new Error('Componente fora de MovieHeaderProvider');
  return ctx;
}

// --- Funções de API ---

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

async function toggleWatched(movieId: string): Promise<{ status: WatchStatus; rewatchCount: number }> {
  try {
    const data = await api.post<{ watched: boolean; rewatchCount: number }>(
      '/watch/movies/toggle',
      { movieId },
    );
    return {
      status: data.watched ? 'WATCHED' : 'WATCHLIST',
      rewatchCount: data.rewatchCount,
    };
  } catch {
    return { status: null, rewatchCount: 0 };
  }
}

async function rewatchMovie(movieId: string): Promise<number> {
  try {
    const data = await api.post<{ watched: boolean; rewatchCount: number }>(
      '/watch/movies/rewatch',
      { movieId },
    );
    return data.rewatchCount;
  } catch {
    return 0;
  }
}

async function rewatchMovieDecrement(movieId: string): Promise<number> {
  try {
    const data = await api.post<{ watched: boolean; rewatchCount: number }>(
      '/watch/movies/rewatch-decrement',
      { movieId },
    );
    return data.rewatchCount;
  } catch {
    return 0;
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

// --- Provider ---

export function MovieHeaderProvider({
  movieId,
  initialStatus,
  initialRewatchCount = 0,
  children,
}: {
  movieId: string;
  initialStatus: WatchStatus;
  initialRewatchCount?: number;
  children: ReactNode;
}) {
  const [status, setStatus] = useState<WatchStatus>(initialStatus);
  const [rewatchCount, setRewatchCount] = useState(initialRewatchCount);
  const [isPending, startTransition] = useTransition();
  const [showWatchedModal, setShowWatchedModal] = useState(false);
  const router = useRouter();

  function handleWatchButtonClick() {
    if (status === 'WATCHED') {
      // Já assistido — abre o modal de opções
      setShowWatchedModal(true);
      return;
    }

    if (status === null) {
      startTransition(async () => {
        const ok = await addToWatchlist(movieId);
        if (ok) setStatus('WATCHLIST');
      });
    } else {
      // WATCHLIST → marca como assistido
      startTransition(async () => {
        const next = await toggleWatched(movieId);
        if (next.status !== null) {
          setStatus(next.status);
          setRewatchCount(next.rewatchCount);
        }
      });
    }
  }

  function handleUnwatch() {
    setShowWatchedModal(false);
    startTransition(async () => {
      const next = await toggleWatched(movieId);
      if (next.status !== null) {
        setStatus(next.status);
        setRewatchCount(0);
      }
    });
  }

  function handleRewatch() {
    setShowWatchedModal(false);
    startTransition(async () => {
      const count = await rewatchMovie(movieId);
      setRewatchCount(count);
    });
  }

  function handleRewatchDecrement() {
    setShowWatchedModal(false);
    startTransition(async () => {
      const count = await rewatchMovieDecrement(movieId);
      setRewatchCount(count);
    });
  }

  function handleRemoveConfirmed() {
    setShowWatchedModal(false);
    startTransition(async () => {
      const ok = await removeFromList(movieId);
      if (ok) {
        setStatus(null);
        setRewatchCount(0);
        router.refresh();
      }
    });
  }

  return (
    <MovieHeaderContext.Provider
      value={{
        movieId,
        status,
        rewatchCount,
        isPending,
        handleWatchButtonClick,
        handleRemoveConfirmed,
        handleUnwatch,
        handleRewatch,
        handleRewatchDecrement,
      }}
    >
      {children}

      {showWatchedModal && (
        <WatchedEpisodeModal
          rewatchCount={rewatchCount}
          onUnwatch={handleUnwatch}
          onRewatch={handleRewatch}
          onRewatchDecrement={handleRewatchDecrement}
          onCancel={() => setShowWatchedModal(false)}
        />
      )}
    </MovieHeaderContext.Provider>
  );
}

// --- Botão de assistido / watchlist (canto inferior direito do backdrop) ---

export function MovieWatchButton() {
  const { status, rewatchCount, isPending, handleWatchButtonClick } = useMovieHeader();

  const isOnList = status !== null;
  const isWatched = status === 'WATCHED';
  const hasRewatches = isWatched && rewatchCount > 0;

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
          ? 'Filme assistido — clique para opções'
          : isOnList
            ? 'Marcar como assistido'
            : 'Adicionar à minha lista'
      }
    >
      {isPending ? (
        <span className={buttonStyles.spinner} aria-hidden="true" />
      ) : hasRewatches ? (
        <span className={buttonStyles.rewatchLabel}>{rewatchCount + 1}x</span>
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
