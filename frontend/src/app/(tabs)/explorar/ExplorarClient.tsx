'use client';

import { useCallback, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SearchBar } from './SearchBar';
import { SearchResults } from './SearchResults';
import { TrendingFeed } from './TrendingFeed';
import { IconFilter } from '@/components/icons';
import styles from './page.module.css';

type FeedFilter = 'all' | 'movie' | 'show';

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

interface ExplorarClientProps {
  initialQuery: string;
  initialMovies: FeedMovie[];
  initialShows: FeedShow[];
  initialMovieTotalPages: number;
  initialShowTotalPages: number;
  searchResultsSlot: React.ReactNode;
}

const TAB_LABELS = ['FEED', 'DESCOBRIR', 'GRUPOS', 'ATIVIDADE'];

const FILTER_OPTIONS: { value: FeedFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'movie', label: 'Filmes' },
  { value: 'show', label: 'Séries' },
];

export function ExplorarClient({
  initialQuery,
  initialMovies,
  initialShows,
  initialMovieTotalPages,
  initialShowTotalPages,
  searchResultsSlot,
}: Readonly<ExplorarClientProps>) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(initialQuery);
  const [filter, setFilter] = useState<FeedFilter>('all');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  const isSearching = query.trim().length > 0;

  const handleChange = useCallback(
    (value: string) => {
      setQuery(value);

      const params = new URLSearchParams(searchParams.toString());
      if (value.trim().length > 0) {
        params.set('q', value);
      } else {
        params.delete('q');
      }
      router.replace(`/explorar?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const handleFilterSelect = useCallback((value: FeedFilter) => {
    setFilter(value);
    setDropdownOpen(false);
  }, []);

  const resultsContent =
    query === initialQuery && searchResultsSlot !== null
      ? searchResultsSlot
      : isSearching
        ? <SearchResults query={query} />
        : null;

  const activeFilterLabel =
    FILTER_OPTIONS.find((o) => o.value === filter)?.label ?? 'Todos';

  return (
    <>
      <SearchBar value={query} onChange={handleChange} />

      {!isSearching && (
        <div className={styles.tabsBar}>
          <nav className={styles.tabsRow} aria-label="Categorias do explorar">
            {TAB_LABELS.map((label, i) => (
              <button
                key={label}
                className={`${styles.tabPill} ${i === 0 ? styles.tabPillActive : ''}`}
                type="button"
                aria-pressed={i === 0}
              >
                {label}
              </button>
            ))}
          </nav>

          <div className={styles.filterWrapper} ref={filterRef}>
            <button
              type="button"
              className={`${styles.filterButton} ${filter !== 'all' ? styles.filterButtonActive : ''}`}
              onClick={() => setDropdownOpen((v) => !v)}
              aria-label="Filtrar por tipo"
              aria-expanded={dropdownOpen}
              aria-haspopup="listbox"
            >
              <IconFilter width={16} height={16} />
              {filter !== 'all' && (
                <span className={styles.filterLabel}>{activeFilterLabel}</span>
              )}
            </button>

            {dropdownOpen && (
              <ul
                className={styles.filterDropdown}
                role="listbox"
                aria-label="Tipo de conteúdo"
              >
                {FILTER_OPTIONS.map((option) => (
                  <li key={option.value} role="option" aria-selected={filter === option.value}>
                    <button
                      type="button"
                      className={`${styles.filterOption} ${filter === option.value ? styles.filterOptionActive : ''}`}
                      onClick={() => handleFilterSelect(option.value)}
                    >
                      {option.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {isSearching ? resultsContent : (
        <TrendingFeed
          initialMovies={initialMovies}
          initialShows={initialShows}
          initialMovieTotalPages={initialMovieTotalPages}
          initialShowTotalPages={initialShowTotalPages}
          filter={filter}
        />
      )}
    </>
  );
}
