'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';
import { tmdbImage } from '@/lib/tmdb-image';
import { IconChevronRight } from '@/components/icons';
import styles from './UpcomingMoviesTimeline.module.css';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

interface UpcomingMovie {
  movieId: string;
  movieTmdbId: number;
  title: string;
  posterPath: string | null;
  releaseDate: string;
  genres: string[];
  cast: string[];
}

interface TimelineGroup {
  label: string;
  date: string; // YYYY-MM-DD
  movies: UpcomingMovie[];
}

// ---------------------------------------------------------------------------
// Helpers de data (mesma lógica da timeline de séries)
// ---------------------------------------------------------------------------

function toLocalDateString(dateStr: string): string {
  return dateStr.slice(0, 10);
}

function todayString(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function tomorrowString(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function yesterdayString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

const WEEKDAY_LABELS: Record<number, string> = {
  0: 'Domingo',
  1: 'Segunda-feira',
  2: 'Terça-feira',
  3: 'Quarta-feira',
  4: 'Quinta-feira',
  5: 'Sexta-feira',
  6: 'Sábado',
};

const MONTH_ABBR: Record<number, string> = {
  0: 'jan.',
  1: 'fev.',
  2: 'mar.',
  3: 'abr.',
  4: 'mai.',
  5: 'jun.',
  6: 'jul.',
  7: 'ago.',
  8: 'set.',
  9: 'out.',
  10: 'nov.',
  11: 'dez.',
};

function formatFullDate(dateStr: string): string {
  const [yyyy, mm, dd] = dateStr.split('-').map(Number);
  const month = MONTH_ABBR[mm - 1] ?? '';
  return `${dd} de ${month} ${yyyy}`;
}

function formatDateLabel(dateStr: string): string {
  const today = todayString();
  const tomorrow = tomorrowString();
  const yesterday = yesterdayString();

  if (dateStr === today) return 'Hoje';
  if (dateStr === yesterday) return 'Ontem';
  if (dateStr === tomorrow) return 'Amanhã';

  const [yyyy, mm, dd] = dateStr.split('-').map(Number);
  const date = new Date(yyyy, mm - 1, dd);
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);
  const diffDays = Math.round(
    (date.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays > 1 && diffDays <= 7) {
    return WEEKDAY_LABELS[date.getDay()] ?? formatFullDate(dateStr);
  }

  return formatFullDate(dateStr);
}

// ---------------------------------------------------------------------------
// Agrupamento por data
// ---------------------------------------------------------------------------

function groupByDate(movies: UpcomingMovie[]): TimelineGroup[] {
  const map = new Map<string, UpcomingMovie[]>();

  for (const movie of movies) {
    const dateKey = toLocalDateString(movie.releaseDate);
    const existing = map.get(dateKey);
    if (existing) {
      existing.push(movie);
    } else {
      map.set(dateKey, [movie]);
    }
  }

  const groups: TimelineGroup[] = [];
  for (const [date, moviesInGroup] of map.entries()) {
    groups.push({
      label: formatDateLabel(date),
      date,
      movies: moviesInGroup,
    });
  }

  groups.sort((a, b) => a.date.localeCompare(b.date));

  return groups;
}

// ---------------------------------------------------------------------------
// Subcomponente: card de filme
// ---------------------------------------------------------------------------

interface MovieCardProps {
  movie: UpcomingMovie;
}

function MovieCard({ movie }: MovieCardProps) {
  const posterUrl = tmdbImage(movie.posterPath, 'w92');

  const dateKey = toLocalDateString(movie.releaseDate);
  const isToday = dateKey === todayString();
  const isYesterday = dateKey === yesterdayString();
  const isNew = isToday || isYesterday;

  const genreLabel = movie.genres.slice(0, 2).join(' · ');
  const castLabel = movie.cast.slice(0, 3).join(' · ');

  return (
    <div className={styles.card}>
      {/* Poster */}
      <div className={styles.poster}>
        {posterUrl ? (
          <Image
            src={posterUrl}
            alt={movie.title}
            fill
            sizes="60px"
            className={styles.posterImage}
          />
        ) : (
          <div className={styles.posterPlaceholder} aria-hidden="true" />
        )}
      </div>

      {/* Informações */}
      <div className={styles.info}>
        <Link
          href={`/filme/${movie.movieTmdbId}`}
          className={styles.movieLink}
          aria-label={`Ver detalhes de ${movie.title}`}
        >
          <span className={styles.movieTitle}>{movie.title}</span>
          <IconChevronRight width={12} height={12} className={styles.movieLinkIcon} />
        </Link>

        {genreLabel && (
          <p className={styles.genres}>{genreLabel}</p>
        )}

        {castLabel && (
          <p className={styles.cast}>{castLabel}</p>
        )}

        {isNew && (
          <span className={styles.badgeNew} aria-label="Lançamento recente">
            NOVO
          </span>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

export function UpcomingMoviesTimeline() {
  const [groups, setGroups] = useState<TimelineGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    api
      .get<UpcomingMovie[]>('/feed/upcoming-movies')
      .then((data) => {
        if (!cancelled) {
          setGroups(groupByDate(data));
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (!(err instanceof ApiError && err.status === 401)) {
          setError(true);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className={styles.skeletonContainer} aria-label="Carregando próximos filmes...">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={styles.skeletonCard} aria-hidden="true" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <p className={styles.emptyMessage}>
        Não foi possível carregar os próximos lançamentos. Tente novamente.
      </p>
    );
  }

  if (groups.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p className={styles.emptyMessage}>
          Nenhum lançamento programado para os próximos 30 dias.
        </p>
        <p className={styles.emptyHint}>
          Adicione filmes à sua lista para acompanhar os lançamentos.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.timeline}>
      {groups.map((group) => (
        <section key={group.date} aria-label={`Lançamentos de ${group.label}`}>
          <div className={styles.dateDivider}>
            <span className={styles.dateLabel}>{group.label.toUpperCase()}</span>
          </div>

          <ul className={styles.movieList}>
            {group.movies.map((movie) => (
              <li key={movie.movieId}>
                <MovieCard movie={movie} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
