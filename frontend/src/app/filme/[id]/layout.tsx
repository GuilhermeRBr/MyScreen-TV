import Image from 'next/image';
import { notFound } from 'next/navigation';
import styles from './layout.module.css';
import { tmdbImage } from '@/lib/tmdb-image';
import { BackButton } from '@/components/BackButton/BackButton';
import {
  MovieHeaderProvider,
  MovieWatchButton,
  MovieOptionsButton,
} from '@/components/MovieHeader/MovieHeader';
import { serverFetch } from '@/lib/server-fetch';

interface Movie {
  id: string;
  tmdbId: number;
  title: string;
  backdropPath: string | null;
  runtime: number | null;
  releaseDate: string | null;
  voteAverage: number;
}

type WatchStatus = 'WATCHLIST' | 'WATCHED' | null;

async function getMovie(id: string): Promise<Movie | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

  try {
    const res = await fetch(`${apiUrl}/movies/${id}`, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) return null;
    return res.json() as Promise<Movie>;
  } catch {
    return null;
  }
}

async function getWatchStatus(movieId: string): Promise<WatchStatus> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

  try {
    const res = await serverFetch(
      `${apiUrl}/watch/movies/${movieId}/status`,
      { cache: 'no-store' },
    );

    if (!res.ok) return null;
    const data = (await res.json()) as { status: WatchStatus };
    return data.status;
  } catch {
    return null;
  }
}

export default async function FilmeLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  const movie = await getMovie(params.id);

  if (!movie) {
    notFound();
  }

  const watchStatus = await getWatchStatus(movie.id);

  const backdropUrl = tmdbImage(movie.backdropPath, 'w780');
  const rating = movie.voteAverage
    ? Math.round(movie.voteAverage * 10) / 10
    : null;

  const releaseYear = movie.releaseDate
    ? new Date(movie.releaseDate).getFullYear()
    : null;

  return (
    <div className="page-container">
      <MovieHeaderProvider movieId={movie.id} initialStatus={watchStatus}>
        {/* Backdrop */}
        <div className={styles.backdrop}>
          {backdropUrl && (
            <Image
              src={backdropUrl}
              alt={movie.title}
              fill
              className={styles.backdropImage}
              sizes="(max-width: 480px) 100vw, (max-width: 1024px) 100vw, 960px"
              priority
            />
          )}
          <div className={styles.backdropOverlay} />

          {/* Barra topo */}
          <div className={styles.topBar}>
            <BackButton fallbackHref="/filmes" label="Voltar" />
            <span className={styles.movieTitle}>{movie.title}</span>
            <MovieOptionsButton />
          </div>

          <div className={styles.progressLine} aria-hidden="true" />

          {/* Botão de lista — sobreposto à linha, canto direito */}
          <div className={styles.watchlistButtonWrapper}>
            <MovieWatchButton />
          </div>
        </div>
      </MovieHeaderProvider>

      {/* Meta */}
      <div className={styles.meta}>
        {releaseYear && (
          <>
            <span>{releaseYear}</span>
            <span className={styles.metaSeparator}>•</span>
          </>
        )}
        {movie.runtime && (
          <>
            <span>{movie.runtime} min</span>
            <span className={styles.metaSeparator}>•</span>
          </>
        )}
        {rating && (
          <span
            className={styles.ratingBadge}
            aria-label={`Avaliação: ${rating}`}
          >
            T {rating}%
          </span>
        )}
      </div>

      {children}
    </div>
  );
}
