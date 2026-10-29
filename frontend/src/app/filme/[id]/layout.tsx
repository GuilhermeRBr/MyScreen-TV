import Image from 'next/image';
import { notFound } from 'next/navigation';
import styles from './layout.module.css';
import { tmdbImage } from '@/lib/tmdb-image';
import { IconDots } from '@/components/icons';
import { BackButton } from '@/components/BackButton/BackButton';

interface Movie {
  id: string;
  tmdbId: number;
  title: string;
  backdropPath: string | null;
  runtime: number | null;
  releaseDate: string | null;
  voteAverage: number;
}

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

  const backdropUrl = tmdbImage(movie.backdropPath, 'w780');
  const rating = movie.voteAverage
    ? Math.round(movie.voteAverage * 10) / 10
    : null;

  const releaseYear = movie.releaseDate
    ? new Date(movie.releaseDate).getFullYear()
    : null;

  return (
    <div className="page-container">
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
          <button className={styles.backButton} aria-label="Mais opções">
            <IconDots width={20} height={20} />
          </button>
        </div>

        <div className={styles.progressLine} aria-hidden="true" />
      </div>

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
