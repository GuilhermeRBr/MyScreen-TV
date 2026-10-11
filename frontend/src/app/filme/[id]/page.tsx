import { notFound } from 'next/navigation';
import styles from './page.module.css';
import { IconStar, IconClock } from '@/components/icons';
import { AddToWatchlistButton } from '@/components/AddToWatchlistButton/AddToWatchlistButton';

interface MovieDetail {
  id: string;
  tmdbId: number;
  title: string;
  overview: string | null;
  releaseDate: string | null;
  runtime: number | null;
  genres: string[];
  voteAverage: number;
  voteCount: number;
}

interface MovieWatchStatus {
  status: 'WATCHLIST' | 'WATCHED' | null;
  watchedAt: string | null;
}

async function getMovieDetail(id: string): Promise<MovieDetail | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

  try {
    const res = await fetch(`${apiUrl}/movies/${id}`, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) return null;
    return res.json() as Promise<MovieDetail>;
  } catch {
    return null;
  }
}

async function getMovieWatchStatus(id: string): Promise<MovieWatchStatus> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

  try {
    const res = await fetch(`${apiUrl}/watch/movies/${id}/status`, {
      credentials: 'include',
      cache: 'no-store',
    });

    if (!res.ok) return { status: null, watchedAt: null };
    return res.json() as Promise<MovieWatchStatus>;
  } catch {
    return { status: null, watchedAt: null };
  }
}

function renderStars(average: number) {
  const rating = Math.round((average / 2) * 2) / 2;
  const stars = [];

  for (let i = 1; i <= 5; i++) {
    stars.push(
      <IconStar
        key={i}
        width={14}
        height={14}
        style={{ opacity: i <= rating ? 1 : 0.25 }}
      />,
    );
  }

  return stars;
}

export default async function FilmePage({
  params,
}: {
  params: { id: string };
}) {
  const [movie, watchStatus] = await Promise.all([
    getMovieDetail(params.id),
    getMovieWatchStatus(params.id),
  ]);

  if (!movie) {
    notFound();
  }

  const releaseYear = movie.releaseDate
    ? new Date(movie.releaseDate).getFullYear()
    : null;

  const ratingDisplay = `${(movie.voteAverage / 2).toFixed(1)}/5`;

  return (
    <div className={styles.container}>
      <div className={styles.actions}>
        <AddToWatchlistButton
          movieId={movie.id}
          initialStatus={watchStatus.status}
        />
      </div>

      <section className={styles.infoBlock} aria-labelledby="info-title">
        <h2 className={styles.infoTitle} id="info-title">
          Informações do filme
        </h2>

        <p className={styles.infoDates}>
          {releaseYear ?? '?'}
          {movie.genres.length > 0 &&
            ` • ${movie.genres.slice(0, 3).join(', ')}`}
        </p>

        <div className={styles.ratingRow}>
          <span className={styles.ratingIcon} aria-hidden="true">
            T
          </span>
          <div className={styles.stars} aria-hidden="true">
            {renderStars(movie.voteAverage)}
          </div>
          <span
            className={styles.ratingValue}
            aria-label={`Avaliação: ${ratingDisplay}`}
          >
            {ratingDisplay}
          </span>
        </div>

        {movie.overview && (
          <p className={styles.overview}>{movie.overview}</p>
        )}

        {movie.runtime && (
          <div className={styles.metaRow}>
            <div className={styles.metaItem}>
              <IconClock width={16} height={16} />
              <span>{movie.runtime} min</span>
            </div>
          </div>
        )}
      </section>

      <div className={styles.tmdbAttribution} role="contentinfo">
        <span className={styles.tmdbLogo}>TMDB</span>
        <span>
          Este produto usa a API do TMDB mas não é endossado ou certificado pelo
          TMDB.
        </span>
      </div>
    </div>
  );
}
