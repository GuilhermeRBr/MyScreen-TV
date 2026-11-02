import Image from 'next/image';
import { Suspense } from 'react';
import styles from './page.module.css';
import { tmdbImage } from '@/lib/tmdb-image';
import { IconPlay, IconClapperboard, IconPlus } from '@/components/icons';
import { ExplorarClient } from './ExplorarClient';
import { SearchResults } from './SearchResults';

interface TmdbMovieItem {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  runtime?: number;
  genres?: Array<{ name: string }>;
}

interface ExplorarPageProps {
  searchParams: { q?: string };
}

async function getTrending() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

  try {
    const res = await fetch(`${apiUrl}/movies/trending`, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) return [];

    const data = (await res.json()) as { results: TmdbMovieItem[] };
    return data.results?.slice(0, 10) ?? [];
  } catch {
    return [];
  }
}

export default async function ExplorarPage({ searchParams }: ExplorarPageProps) {
  const initialQuery = searchParams.q ?? '';
  const isSearching = initialQuery.trim().length >= 2;

  // Só busca o trending se não há busca ativa — evita fetch desnecessário
  const trending = isSearching ? [] : await getTrending();

  const trendingFeed = (
    <section className={styles.feed} aria-label="Filmes em destaque">
      {trending.map((movie) => {
        const backdropUrl = tmdbImage(movie.backdrop_path ?? movie.poster_path, 'w780');

        return (
          <article key={movie.id} className={styles.feedCard}>
            <div className={styles.feedBackdrop}>
              {backdropUrl && (
                <Image
                  src={backdropUrl}
                  alt={movie.title}
                  fill
                  className={styles.feedBackdropImage}
                  sizes="(max-width: 480px) 100vw, (max-width: 768px) 100vw, 33vw"
                />
              )}
              <div className={styles.playButton} aria-hidden="true">
                <IconPlay width={48} height={48} />
              </div>
              <button
                className={styles.addButton}
                type="button"
                aria-label={`Adicionar ${movie.title} à minha lista`}
              >
                <IconPlus width={16} height={16} />
              </button>
            </div>

            <div className={styles.feedInfo}>
              <div className={styles.feedMeta}>
                <IconClapperboard
                  className={styles.feedTypeIcon}
                  width={14}
                  height={14}
                />
                <h2 className={styles.feedTitle}>{movie.title}</h2>
              </div>
              {movie.runtime && (
                <p className={styles.feedSubtitle}>
                  {Math.floor(movie.runtime / 60)}h {movie.runtime % 60}min
                  {movie.genres && movie.genres.length > 0 && (
                    <> &bull; {movie.genres.map((g) => g.name).join(', ')}</>
                  )}
                </p>
              )}
              {movie.overview && (
                <p className={styles.feedOverview}>{movie.overview}</p>
              )}
            </div>
          </article>
        );
      })}
    </section>
  );

  return (
    <div className={styles.container}>
      <Suspense>
        <ExplorarClient
          initialQuery={initialQuery}
          trendingFeed={trendingFeed}
          // Quando há busca ativa, passa o slot de resultados pré-renderizado
          // para que o HTML inicial já contenha o estado correto — sem flash
          searchResultsSlot={
            isSearching ? (
              <SearchResults query={initialQuery} />
            ) : null
          }
        />
      </Suspense>
    </div>
  );
}
