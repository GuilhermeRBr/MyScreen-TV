'use client';

import { useState, useCallback, useTransition } from 'react';
import Image from 'next/image';
import { tmdbImage } from '@/lib/tmdb-image';
import { IconPlay, IconClapperboard, IconPlus, IconCheck } from '@/components/icons';
import styles from './FeedCard.module.css';

interface FeedCardProps {
  id: number;
  title: string;
  overview: string | null;
  backdropPath: string | null;
  posterPath: string | null;
  runtime: number | null;
  genres: Array<{ name: string }> | null;
  trailerKey: string | null;
  mediaType: 'movie' | 'show';
  initialOnList?: boolean;
}

async function addToList(tmdbId: number, mediaType: 'movie' | 'show'): Promise<boolean> {
  try {
    const res = await fetch(`/api/watch/by-tmdb/add?type=${mediaType}`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tmdbId }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function removeFromList(tmdbId: number, mediaType: 'movie' | 'show'): Promise<boolean> {
  try {
    const res = await fetch(`/api/watch/by-tmdb/remove?type=${mediaType}&tmdbId=${tmdbId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function FeedCard({
  id,
  title,
  overview,
  backdropPath,
  posterPath,
  runtime,
  genres,
  trailerKey,
  mediaType,
  initialOnList = false,
}: Readonly<FeedCardProps>) {
  const [playing, setPlaying] = useState(false);
  const [onList, setOnList] = useState(initialOnList);
  const [isPending, startTransition] = useTransition();

  const backdropUrl = tmdbImage(backdropPath ?? posterPath, 'w780');
  const hasTrailer = Boolean(trailerKey);

  const handlePlay = useCallback(() => {
    if (trailerKey) setPlaying(true);
  }, [trailerKey]);

  const handleStop = useCallback(() => {
    setPlaying(false);
  }, []);

  const handleListToggle = useCallback(() => {
    startTransition(async () => {
      if (onList) {
        const ok = await removeFromList(id, mediaType);
        if (ok) setOnList(false);
      } else {
        const ok = await addToList(id, mediaType);
        if (ok) setOnList(true);
      }
    });
  }, [id, mediaType, onList]);

  return (
    <article className={styles.feedCard}>
      <div className={styles.feedBackdrop}>
        {playing && trailerKey ? (
          <iframe
            className={styles.trailer}
            src={`https://www.youtube-nocookie.com/embed/${trailerKey}?autoplay=1&rel=0&modestbranding=1`}
            title={`Trailer de ${title}`}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <>
            {backdropUrl && (
              <Image
                src={backdropUrl}
                alt={title}
                fill
                className={styles.feedBackdropImage}
                sizes="(max-width: 480px) 100vw, (max-width: 768px) 100vw, 33vw"
              />
            )}
            {hasTrailer ? (
              <button
                type="button"
                className={styles.playButton}
                onClick={handlePlay}
                aria-label={`Reproduzir trailer de ${title}`}
              >
                <IconPlay width={64} height={64} />
              </button>
            ) : (
              <div className={styles.playButton} aria-hidden="true">
                <IconPlay width={64} height={64} />
              </div>
            )}
          </>
        )}

        {playing ? (
          <button
            type="button"
            className={styles.stopButton}
            onClick={handleStop}
            aria-label="Fechar trailer"
          >
            <svg
              width={16}
              height={16}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        ) : (
          <button
            className={`${styles.addButton} ${onList ? styles.addButtonActive : ''}`}
            type="button"
            disabled={isPending}
            onClick={handleListToggle}
            aria-label={
              onList
                ? `Remover ${title} da minha lista`
                : `Adicionar ${title} à minha lista`
            }
          >
            {isPending ? (
              <span className={styles.spinner} aria-hidden="true" />
            ) : onList ? (
              <IconCheck width={16} height={16} />
            ) : (
              <IconPlus width={16} height={16} />
            )}
          </button>
        )}
      </div>

      <div className={styles.feedInfo}>
        <div className={styles.feedMeta}>
          <IconClapperboard
            className={styles.feedTypeIcon}
            width={14}
            height={14}
          />
          <h2 className={styles.feedTitle}>{title}</h2>
        </div>
        {runtime != null && runtime > 0 && (
          <p className={styles.feedSubtitle}>
            {Math.floor(runtime / 60)}h {runtime % 60}min
            {genres && genres.length > 0 && (
              <> &bull; {genres.map((g) => g.name).join(', ')}</>
            )}
          </p>
        )}
        {overview && <p className={styles.feedOverview}>{overview}</p>}
      </div>
    </article>
  );
}
