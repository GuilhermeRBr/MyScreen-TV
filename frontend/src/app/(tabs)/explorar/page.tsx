import { Suspense } from 'react';
import styles from './page.module.css';
import { ExplorarClient } from './ExplorarClient';
import { SearchResults } from './SearchResults';

interface FeedMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  runtime?: number;
  genres?: Array<{ name: string }>;
  trailerKey: string | null;
}

interface FeedShow {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  trailerKey: string | null;
}

interface FeedResponse<T> {
  results: T[];
  page: number;
  total_pages: number;
}

interface ExplorarPageProps {
  searchParams: { q?: string };
}

const EMPTY_FEED = { results: [], page: 1, total_pages: 1 };

async function getInitialMovieFeed(): Promise<FeedResponse<FeedMovie>> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
  try {
    const res = await fetch(`${apiUrl}/movies/feed?page=1`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return EMPTY_FEED as FeedResponse<FeedMovie>;
    return (await res.json()) as FeedResponse<FeedMovie>;
  } catch {
    return EMPTY_FEED as FeedResponse<FeedMovie>;
  }
}

async function getInitialShowFeed(): Promise<FeedResponse<FeedShow>> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
  try {
    const res = await fetch(`${apiUrl}/shows/feed?page=1`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return EMPTY_FEED as FeedResponse<FeedShow>;
    return (await res.json()) as FeedResponse<FeedShow>;
  } catch {
    return EMPTY_FEED as FeedResponse<FeedShow>;
  }
}

export default async function ExplorarPage({ searchParams }: ExplorarPageProps) {
  const initialQuery = searchParams.q ?? '';
  const isSearching = initialQuery.trim().length >= 2;

  const [movieFeed, showFeed] = isSearching
    ? [EMPTY_FEED as FeedResponse<FeedMovie>, EMPTY_FEED as FeedResponse<FeedShow>]
    : await Promise.all([getInitialMovieFeed(), getInitialShowFeed()]);

  return (
    <div className={styles.container}>
      <Suspense>
        <ExplorarClient
          initialQuery={initialQuery}
          initialMovies={movieFeed.results}
          initialShows={showFeed.results}
          initialMovieTotalPages={movieFeed.total_pages}
          initialShowTotalPages={showFeed.total_pages}
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
