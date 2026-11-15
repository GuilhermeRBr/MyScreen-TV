'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { PosterCard } from '@/components/PosterCard/PosterCard';
import { api } from '@/lib/api';
import styles from './HorizontalRow.module.css';

export interface HorizontalRowItem {
  id: number;
  name?: string;
  title?: string;
  poster_path: string | null;
}

interface HorizontalRowProps {
  /** Título exibido acima da linha. */
  title: string;
  /** Endpoint paginado que retorna `{ results, total_pages }`. */
  endpoint: string;
  /** Prefixo do href dos cards: `/show` ou `/filme`. */
  hrefPrefix: '/show' | '/filme';
  /** Sufixo do href dos cards de série (ex: `/sobre`). Ignorado em filmes. */
  hrefSuffix?: string;
}

interface PageData {
  results: HorizontalRowItem[];
  total_pages: number;
}

const SCROLL_AMOUNT = 280;

export function HorizontalRow({
  title,
  endpoint,
  hrefPrefix,
  hrefSuffix = '/sobre',
}: HorizontalRowProps) {
  const [items, setItems] = useState<HorizontalRowItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const gridRef = useRef<HTMLDivElement>(null);
  const nextPageRef = useRef(1);
  const totalPagesRef = useRef(1);
  const isFetchingRef = useRef(false);

  function updateScrollState() {
    const el = gridRef.current;
    if (!el) return;
    setCanScrollPrev(el.scrollLeft > 0);
    setCanScrollNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }

  function scrollPrev() {
    gridRef.current?.scrollBy({ left: -SCROLL_AMOUNT, behavior: 'smooth' });
  }

  function scrollNext() {
    gridRef.current?.scrollBy({ left: SCROLL_AMOUNT, behavior: 'smooth' });
  }

  const loadNextPage = useCallback(async () => {
    if (isFetchingRef.current) return;
    if (nextPageRef.current > totalPagesRef.current) return;

    isFetchingRef.current = true;

    try {
      const data = await api.get<PageData>(
        `${endpoint}?page=${nextPageRef.current}`,
      );
      totalPagesRef.current = data.total_pages;
      nextPageRef.current += 1;
      setItems((prev) => [...prev, ...data.results]);
    } catch {
      // Falha silenciosa — o usuário pode continuar usando a página
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  }, [endpoint]);

  // Carrega a primeira página ao montar
  useEffect(() => {
    void loadNextPage();
  }, [loadNextPage]);

  // Atualiza botões quando os itens mudam
  useEffect(() => {
    updateScrollState();
  }, [items]);

  // Carrega mais ao chegar no fim do scroll
  function handleScroll() {
    updateScrollState();

    const el = gridRef.current;
    if (!el) return;

    const nearEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 100;
    if (nearEnd) {
      void loadNextPage();
    }
  }

  if (loading) {
    return (
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{title}</h2>
        <div className={styles.grid} aria-label={`Carregando ${title.toLowerCase()}...`}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={styles.skeleton} aria-hidden="true" />
          ))}
        </div>
      </section>
    );
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <section className={styles.section} aria-labelledby={`row-title-${title}`}>
      <h2 className={styles.sectionTitle} id={`row-title-${title}`}>
        {title}
      </h2>

      <div className={styles.wrapper}>
        <button
          className={`${styles.navBtn} ${styles.navPrev}`}
          onClick={scrollPrev}
          disabled={!canScrollPrev}
          aria-label="Rolar para a esquerda"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width="36"
            height="36"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="12" fill="currentColor" />
            <path
              d="M13.5 8L10.5 12L13.5 16"
              fill="none"
              stroke="black"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <div
          className={styles.grid}
          ref={gridRef}
          onScroll={handleScroll}
        >
          {items.map((item) => {
            const label = item.name ?? item.title ?? '';
            const href =
              hrefPrefix === '/show'
                ? `/show/${item.id}${hrefSuffix}`
                : `/filme/${item.id}`;

            return (
              <PosterCard
                key={item.id}
                title={label}
                posterPath={item.poster_path}
                href={href}
              />
            );
          })}
        </div>

        <button
          className={`${styles.navBtn} ${styles.navNext}`}
          onClick={scrollNext}
          disabled={!canScrollNext}
          aria-label="Rolar para a direita"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width="36"
            height="36"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="12" fill="currentColor" />
            <path
              d="M10.5 8L13.5 12L10.5 16"
              fill="none"
              stroke="black"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </section>
  );
}
