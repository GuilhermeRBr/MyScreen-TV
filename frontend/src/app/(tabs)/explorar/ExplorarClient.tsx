'use client';

import { useCallback, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SearchBar } from './SearchBar';
import { SearchResults } from './SearchResults';
import styles from './page.module.css';

interface ExplorarClientProps {
  initialQuery: string;
  trendingFeed: React.ReactNode;
  searchResultsSlot: React.ReactNode;
}

const TAB_LABELS = ['FEED', 'DESCOBRIR', 'GRUPOS', 'ATIVIDADE'];

export function ExplorarClient({
  initialQuery,
  trendingFeed,
  searchResultsSlot,
}: Readonly<ExplorarClientProps>) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Inicializa com o valor vindo do servidor — sem divergência SSR/client
  const [query, setQuery] = useState(initialQuery);

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

  // Após a hidratação, se o usuário já está digitando, usa SearchResults client-side.
  // Na carga inicial com busca (ex: ao voltar), usa o slot pré-renderizado pelo servidor
  // para evitar o flash de tela preta.
  const resultsContent =
    query === initialQuery && searchResultsSlot !== null
      ? searchResultsSlot
      : isSearching
        ? <SearchResults query={query} />
        : null;

  return (
    <>
      <SearchBar value={query} onChange={handleChange} />

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

      {isSearching ? resultsContent : trendingFeed}
    </>
  );
}
