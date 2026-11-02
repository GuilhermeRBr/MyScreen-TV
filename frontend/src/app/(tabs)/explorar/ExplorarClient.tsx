'use client';

import { useState } from 'react';
import { SearchBar } from './SearchBar';
import { SearchResults } from './SearchResults';
import styles from './page.module.css';

interface ExplorarClientProps {
  trendingFeed: React.ReactNode;
}

const TAB_LABELS = ['FEED', 'DESCOBRIR', 'GRUPOS', 'ATIVIDADE'];

export function ExplorarClient({ trendingFeed }: Readonly<ExplorarClientProps>) {
  const [query, setQuery] = useState('');
  const isSearching = query.trim().length > 0;

  return (
    <>
      <SearchBar value={query} onChange={setQuery} />

      {!isSearching && (
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
      )}

      {isSearching ? (
        <SearchResults query={query} />
      ) : (
        trendingFeed
      )}
    </>
  );
}
