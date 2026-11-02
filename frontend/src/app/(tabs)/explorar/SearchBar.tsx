'use client';

import { useCallback, useEffect, useRef } from 'react';
import { IconSearch } from '@/components/icons';
import styles from './page.module.css';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
    },
    [onChange],
  );

  const handleClear = useCallback(() => {
    onChange('');
    inputRef.current?.focus();
  }, [onChange]);

  // Foca no input ao montar (apenas em mobile evita o teclado indesejado no desktop)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
      inputRef.current?.focus();
    }
  }, []);

  return (
    <div className={styles.searchBar} role="search">
      <IconSearch className={styles.searchIcon} width={20} height={20} />
      <input
        ref={inputRef}
        type="search"
        className={styles.searchInput}
        placeholder="Pesquisar séries e filmes"
        aria-label="Pesquisar séries e filmes"
        value={value}
        onChange={handleChange}
        autoComplete="off"
        spellCheck={false}
      />
      {value.length > 0 && (
        <button
          type="button"
          className={styles.searchClearButton}
          onClick={handleClear}
          aria-label="Limpar pesquisa"
        >
          <svg
            width={16}
            height={16}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  );
}
