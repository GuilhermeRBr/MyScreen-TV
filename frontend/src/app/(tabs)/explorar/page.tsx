import { Suspense } from 'react';
import styles from './page.module.css';
import { FeedCard } from '@/components/FeedCard/FeedCard';
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
  trailerKey?: string | null;
}

interface ExplorarPageProps {
  searchParams: { q?: string };
}

async function getTrending() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

  try {
    const res = await fetch(`${apiUrl}/movies/trending`, {
      // Cache curto: trailers raramente mudam, mas não queremos servir
      // dados sem trailerKey por horas caso o backend seja atualizado.
      next: { revalidate: 300 },
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
      {trending.map((movie) => (
        <FeedCard
          key={movie.id}
          id={movie.id}
          title={movie.title}
          overview={movie.overview ?? null}
          backdropPath={movie.backdrop_path ?? null}
          posterPath={movie.poster_path ?? null}
          runtime={movie.runtime ?? null}
          genres={movie.genres ?? null}
          trailerKey={movie.trailerKey ?? null}
          mediaType="movie"
        />
      ))}
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
