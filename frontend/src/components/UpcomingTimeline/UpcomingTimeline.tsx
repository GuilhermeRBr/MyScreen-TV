'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';
import { tmdbImage } from '@/lib/tmdb-image';
import { IconChevronRight } from '@/components/icons';
import styles from './UpcomingTimeline.module.css';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

interface UpcomingEpisode {
  episodeId: string;
  showId: string;
  showTmdbId: number;
  showName: string;
  posterPath: string | null;
  network: string | null;
  seasonNumber: number;
  episodeNumber: number;
  episodeName: string;
  airDate: string;
}

interface TimelineGroup {
  label: string;
  date: string; // YYYY-MM-DD
  episodes: UpcomingEpisode[];
}

// ---------------------------------------------------------------------------
// Helpers de data
// ---------------------------------------------------------------------------

function toLocalDateString(dateStr: string): string {
  // airDate vem como ISO string do backend; extrai só a parte YYYY-MM-DD
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

function formatDateLabel(dateStr: string): string {
  const today = todayString();
  const tomorrow = tomorrowString();
  const yesterday = yesterdayString();

  if (dateStr === today) return 'Hoje';
  if (dateStr === yesterday) return 'Ontem';
  if (dateStr === tomorrow) return 'Amanhã';

  // Determina dia da semana: os próximos 7 dias viram "Quarta-feira", etc.
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

// ---------------------------------------------------------------------------
// Agrupamento por data
// ---------------------------------------------------------------------------

function groupByDate(episodes: UpcomingEpisode[]): TimelineGroup[] {
  const map = new Map<string, UpcomingEpisode[]>();

  for (const ep of episodes) {
    const dateKey = toLocalDateString(ep.airDate);
    const existing = map.get(dateKey);
    if (existing) {
      existing.push(ep);
    } else {
      map.set(dateKey, [ep]);
    }
  }

  const groups: TimelineGroup[] = [];
  for (const [date, eps] of map.entries()) {
    groups.push({
      label: formatDateLabel(date),
      date,
      episodes: eps,
    });
  }

  // Ordena os grupos por data
  groups.sort((a, b) => a.date.localeCompare(b.date));

  return groups;
}

// ---------------------------------------------------------------------------
// Subcomponente: card de episódio
// ---------------------------------------------------------------------------

interface EpisodeCardProps {
  episode: UpcomingEpisode;
}

function EpisodeCard({ episode }: EpisodeCardProps) {
  const posterUrl = tmdbImage(episode.posterPath, 'w92');
  const seasonEpisodeLabel = `T${String(episode.seasonNumber).padStart(2, '0')} | E${String(episode.episodeNumber).padStart(2, '0')}`;

  const isToday = toLocalDateString(episode.airDate) === todayString();
  const isYesterday = toLocalDateString(episode.airDate) === yesterdayString();
  const isNew = isToday || isYesterday;

  return (
    <div className={styles.card}>
      {/* Poster da série */}
      <div className={styles.poster}>
        {posterUrl ? (
          <Image
            src={posterUrl}
            alt={episode.showName}
            fill
            sizes="64px"
            className={styles.posterImage}
          />
        ) : (
          <div className={styles.posterPlaceholder} aria-hidden="true" />
        )}
      </div>

      {/* Informações do episódio */}
      <div className={styles.info}>
        <Link
          href={`/show/${episode.showTmdbId}/sobre`}
          className={styles.showLink}
          aria-label={`Ver detalhes de ${episode.showName}`}
        >
          <span className={styles.showName}>{episode.showName}</span>
          <IconChevronRight width={12} height={12} className={styles.showLinkIcon} />
        </Link>

        <p className={styles.episodeCode}>{seasonEpisodeLabel}</p>
        <p className={styles.episodeName}>{episode.episodeName}</p>

        {isNew && (
          <span className={styles.badgeNew} aria-label="Novo episódio">
            NOVO
          </span>
        )}
      </div>

      {/* Network à direita (quando há data futura) */}
      {!isNew && episode.network && (
        <div className={styles.networkInfo}>
          <span className={styles.networkName}>{episode.network}</span>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

export function UpcomingTimeline() {
  const [groups, setGroups] = useState<TimelineGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    api
      .get<UpcomingEpisode[]>('/feed/upcoming')
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
      <div className={styles.skeletonContainer} aria-label="Carregando próximos episódios...">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={styles.skeletonCard} aria-hidden="true" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <p className={styles.emptyMessage}>
        Não foi possível carregar os próximos episódios. Tente novamente.
      </p>
    );
  }

  if (groups.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p className={styles.emptyMessage}>
          Nenhum episódio programado para os próximos 30 dias.
        </p>
        <p className={styles.emptyHint}>
          Adicione séries à sua lista para acompanhar os lançamentos.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.timeline}>
      {groups.map((group) => (
        <section key={group.date} aria-label={`Episódios de ${group.label}`}>
          {/* Separador de data */}
          <div className={styles.dateDivider}>
            <span className={styles.dateLabel}>{group.label.toUpperCase()}</span>
          </div>

          {/* Cards de episódio do dia */}
          <ul className={styles.episodeList}>
            {group.episodes.map((ep) => (
              <li key={ep.episodeId}>
                <EpisodeCard episode={ep} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
