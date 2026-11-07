import { Suspense } from 'react';
import styles from './page.module.css';
import { TrendingFeed } from './TrendingFeed';
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

interface FeedResponse {
  results: FeedMovie[];
  page: number;
  total_pages: number;
}

interface ExplorarPageProps {
  searchParams: { q?: string };
}

async function getInitialFeed(): Promise<FeedResponse> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

  try {
    const res = await fetch(`${apiUrl}/movies/feed?page=1`, {
      next: { revalidate: 300 },
    });

    if (!res.ok) return { results: [], page: 1, total_pages: 1 };

    return (await res.json()) as FeedResponse;
  } catch {
    return { results: [], page: 1, total_pages: 1 };
  }
}

export default async function ExplorarPage({ searchParams }: ExplorarPageProps) {
  const initialQuery = searchParams.q ?? '';
  const isSearching = initialQuery.trim().length >= 2;

  const feed = isSearching ? { results: [], page: 1, total_pages: 1 } : await getInitialFeed();

  const trendingFeed = (
    <TrendingFeed
      initialMovies={feed.results}
      initialTotalPages={feed.total_pages}
    />
  );

  return (
    <div className={styles.container}>
      <Suspense>
        <ExplorarClient
          initialQuery={initialQuery}
          trendingFeed={trendingFeed}
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
