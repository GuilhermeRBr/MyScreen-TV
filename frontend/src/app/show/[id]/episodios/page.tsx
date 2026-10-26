'use client';

import { useEffect, useState } from 'react';
import type React from 'react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import styles from './page.module.css';
import { tmdbImage } from '@/lib/tmdb-image';
import { IconCheck, IconChevronDown } from '@/components/icons';
import { api } from '@/lib/api';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

interface Episode {
  id: string;
  episodeNumber: number;
  name: string;
  stillPath: string | null;
  runtime: number | null;
  watched: boolean;
}

interface SeasonWithEpisodes {
  id: string;
  seasonNumber: number;
  name: string;
  episodeCount: number;
  watchedCount: number;
  episodes: Episode[];
}

interface WatchProgressResponse {
  showId: string;
  totalWatched: number;
  totalEpisodes: number;
  seasons: Array<{
    seasonId: string;
    seasonNumber: number;
    watchedCount: number;
    totalCount: number;
    isComplete: boolean;
  }>;
}

interface RawSeason {
  id: string;
  seasonNumber: number;
  name: string;
  episodeCount: number;
}

interface RawEpisode {
  id: string;
  episodeNumber: number;
  name: string;
  stillPath: string | null;
  runtime: number | null;
}

// ---------------------------------------------------------------------------
// Página
// ---------------------------------------------------------------------------

const CONTINUE_LIMIT = 8; // quantos cards no carrossel "continuar"

export default function EpisodiosPage() {
  const params = useParams<{ id: string }>();
  const showId = params.id;

  const [seasons, setSeasons] = useState<SeasonWithEpisodes[]>([]);
  const [loading, setLoading] = useState(true);
  const [openSeasons, setOpenSeasons] = useState<Set<string>>(new Set());
  const [internalShowId, setInternalShowId] = useState<string | null>(null);

  // ---- Carregamento inicial: temporadas + episódios + progresso em paralelo ----
  useEffect(() => {
    let cancelled = false;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

    async function load() {
      try {
        // 1. Série (UUID interno) + temporadas em paralelo
        const [showRes, seasonsRes] = await Promise.all([
          fetch(`${apiUrl}/shows/${showId}`),
          fetch(`${apiUrl}/shows/${showId}/seasons`),
        ]);

        if (!showRes.ok || !seasonsRes.ok || cancelled) return;

        const show = await showRes.json() as { id: string };
        const rawSeasons = await seasonsRes.json() as RawSeason[];
        if (cancelled) return;

        setInternalShowId(show.id);

        // 2. Progresso do usuário + todos os episódios de todas as temporadas + IDs assistidos em paralelo
        const [progress, watchedIdsRes, ...episodeResults] = await Promise.all([
          api.get<WatchProgressResponse>(`/watch/shows/${show.id}/progress`).catch(() => null),
          api.get<{ watchedEpisodeIds: string[] }>(`/watch/shows/${show.id}/watched-episodes`).catch(() => null),
          ...rawSeasons.map((s) =>
            fetch(`${apiUrl}/shows/${showId}/seasons/${s.seasonNumber}/episodes`, {
              cache: 'no-store',
            })
              .then((r) => (r.ok ? r.json() as Promise<{ episodes: RawEpisode[] }> : { episodes: [] }))
              .catch(() => ({ episodes: [] as RawEpisode[] })),
          ),
        ]);

        if (cancelled) return;

        const progressMap = new Map(
          (progress?.seasons ?? []).map((s) => [s.seasonNumber, s.watchedCount]),
        );

        const watchedSet = new Set<string>(watchedIdsRes?.watchedEpisodeIds ?? []);

        const built: SeasonWithEpisodes[] = rawSeasons.map((s, i) => {
          const eps: RawEpisode[] = (episodeResults[i] as { episodes: RawEpisode[] }).episodes ?? [];
          const wc = progressMap.get(s.seasonNumber) ?? 0;

          return {
            id: s.id,
            seasonNumber: s.seasonNumber,
            name: s.name,
            episodeCount: s.episodeCount,
            watchedCount: wc,
            episodes: eps.map((ep) => ({
              ...ep,
              watched: watchedSet.has(ep.id),
            })),
          };
        });

        if (!cancelled) setSeasons(built);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [showId]);

  // ---- Episódios para "continuar acompanhando" ----
  // Todos os não assistidos em ordem, limitados a CONTINUE_LIMIT
  const continueEpisodes: Array<{ episode: Episode; season: SeasonWithEpisodes }> = [];
  for (const season of seasons) {
    for (const ep of season.episodes) {
      if (!ep.watched) {
        continueEpisodes.push({ episode: ep, season });
        if (continueEpisodes.length >= CONTINUE_LIMIT) break;
      }
    }
    if (continueEpisodes.length >= CONTINUE_LIMIT) break;
  }

  // ---- Totais ----
  const totalWatched = seasons.reduce((acc, s) => acc + s.watchedCount, 0);
  const totalEpisodes = seasons.reduce((acc, s) => acc + s.episodeCount, 0);
  const allWatched = totalEpisodes > 0 && totalWatched === totalEpisodes;

  // ---- Handlers ----
  function toggleSeason(seasonId: string) {
    setOpenSeasons((prev) => {
      const next = new Set(prev);
      if (next.has(seasonId)) next.delete(seasonId);
      else next.add(seasonId);
      return next;
    });
  }

  async function toggleEpisode(episodeId: string) {
    try {
      const result = await api.post<{ watched: boolean }>(
        '/watch/episodes/toggle',
        { episodeId },
      );

      setSeasons((prev) =>
        prev.map((s) => {
          const hasEp = s.episodes.some((e) => e.id === episodeId);
          if (!hasEp) return s;

          const updatedEps = s.episodes.map((e) =>
            e.id === episodeId ? { ...e, watched: result.watched } : e,
          );
          return {
            ...s,
            episodes: updatedEps,
            watchedCount: updatedEps.filter((e) => e.watched).length,
          };
        }),
      );
    } catch {
      // falha silenciosa
    }
  }

  async function toggleSeasonWatched(season: SeasonWithEpisodes, e: React.MouseEvent) {
    e.stopPropagation();

    const isComplete = season.watchedCount >= season.episodeCount && season.episodeCount > 0;

    try {
      if (isComplete) {
        await api.delete(`/watch/seasons/${season.id}/mark-all`);
        setSeasons((prev) =>
          prev.map((s) =>
            s.id === season.id
              ? { ...s, watchedCount: 0, episodes: s.episodes.map((ep) => ({ ...ep, watched: false })) }
              : s,
          ),
        );
      } else {
        await api.post(`/watch/seasons/${season.id}/mark-all`);
        setSeasons((prev) =>
          prev.map((s) =>
            s.id === season.id
              ? {
                  ...s,
                  watchedCount: s.episodeCount,
                  episodes: s.episodes.map((ep) => ({ ...ep, watched: true })),
                }
              : s,
          ),
        );
      }
    } catch {
      // falha silenciosa
    }
  }

  async function toggleAllWatched() {
    if (!internalShowId) return;

    try {
      if (allWatched) {
        for (const season of seasons) {
          await api.delete(`/watch/seasons/${season.id}/mark-all`);
        }
        setSeasons((prev) =>
          prev.map((s) => ({
            ...s,
            watchedCount: 0,
            episodes: s.episodes.map((ep) => ({ ...ep, watched: false })),
          })),
        );
      } else {
        for (const season of seasons) {
          await api.post(`/watch/seasons/${season.id}/mark-all`);
        }
        const progress = await api.get<WatchProgressResponse>(
          `/watch/shows/${internalShowId}/progress`,
        );
        const progressMap = new Map(
          progress.seasons.map((s) => [s.seasonNumber, s.watchedCount]),
        );
        setSeasons((prev) =>
          prev.map((s) => ({
            ...s,
            watchedCount: progressMap.get(s.seasonNumber) ?? s.watchedCount,
            episodes: s.episodes.map((ep) => ({ ...ep, watched: true })),
          })),
        );
      }
    } catch {
      // falha silenciosa
    }
  }

  // ---- Render ----
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.skeletonList}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={styles.skeletonRow} aria-hidden="true" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Continuar acompanhando */}
      {continueEpisodes.length > 0 && (
        <section className={styles.continueSection}>
          <h2 className={styles.continueSectionTitle}>Continuar acompanhando</h2>
          <div className={styles.continueScroll}>
            {continueEpisodes.map(({ episode: ep, season: s }) => (
              <button
                key={ep.id}
                className={styles.continueCard}
                onClick={() => toggleEpisode(ep.id)}
                aria-label={`Marcar ${ep.name} como assistido`}
              >
                <div className={styles.continueStill}>
                  {ep.stillPath && (
                    <Image
                      src={tmdbImage(ep.stillPath, 'w185') ?? ''}
                      alt={ep.name}
                      fill
                      className={styles.continueStillImage}
                    />
                  )}
                </div>
                <div className={styles.continueInfo}>
                  <p className={styles.continueCode}>
                    T{String(s.seasonNumber).padStart(2, '0')} | E{String(ep.episodeNumber).padStart(2, '0')}
                  </p>
                  <p className={styles.continueName}>{ep.name}</p>
                </div>
                <div
                  className={`${styles.checkCircle} ${ep.watched ? styles.checkCircleWatched : ''}`}
                  aria-hidden="true"
                >
                  <IconCheck width={14} height={14} />
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Todos os episódios */}
      <section className={styles.allEpisodesSection}>
        <div className={styles.allEpisodesHeader}>
          <h2 className={styles.allEpisodesTitle}>Todos os episodios</h2>
          <button
            className={`${styles.checkCircle} ${allWatched ? styles.checkCircleWatched : ''}`}
            aria-label={allWatched ? 'Desmarcar todos os episódios' : 'Marcar todos como assistidos'}
            onClick={toggleAllWatched}
          >
            <IconCheck width={14} height={14} />
          </button>
        </div>

        <div className={styles.seasonAccordion} role="list">
          {seasons.map((season) => {
            const watched = season.watchedCount;
            const total = season.episodeCount;
            const percent = total > 0 ? (watched / total) * 100 : 0;
            const isComplete = total > 0 && watched === total;
            const isOpen = openSeasons.has(season.id);

            return (
              <div key={season.id} role="listitem">
                <button
                  className={styles.seasonRow}
                  aria-expanded={isOpen}
                  aria-controls={`season-episodes-${season.id}`}
                  onClick={() => toggleSeason(season.id)}
                  aria-label={`${season.name}, ${watched} de ${total} episodios assistidos`}
                >
                  <span className={styles.seasonName}>{season.name}</span>
                  <span className={styles.seasonCount}>{watched}/{total}</span>
                  {isComplete ? (
                    <button
                      className={styles.seasonCheckCircle}
                      aria-label={`Desmarcar ${season.name} como assistida`}
                      onClick={(e) => toggleSeasonWatched(season, e)}
                    >
                      <IconCheck width={14} height={14} />
                    </button>
                  ) : (
                    <IconChevronDown
                      width={20}
                      height={20}
                      className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}
                    />
                  )}
                </button>

                <div className={styles.progressBarSeason} aria-hidden="true">
                  <div
                    className={styles.progressBarFill}
                    style={{ width: `${percent}%` }}
                  />
                </div>

                {isOpen && (
                  <div
                    id={`season-episodes-${season.id}`}
                    className={styles.episodeList}
                  >
                    {season.episodes.map((ep) => (
                      <button
                        key={ep.id}
                        className={styles.episodeRow}
                        onClick={() => toggleEpisode(ep.id)}
                        aria-label={`${ep.watched ? 'Desmarcar' : 'Marcar'} episódio ${ep.episodeNumber} como assistido`}
                      >
                        <div className={styles.episodeStill}>
                          {ep.stillPath ? (
                            <Image
                              src={tmdbImage(ep.stillPath, 'w185') ?? ''}
                              alt={ep.name}
                              fill
                              className={styles.episodeStillImage}
                            />
                          ) : (
                            <div className={styles.episodeStillPlaceholder} />
                          )}
                        </div>
                        <div className={styles.episodeInfo}>
                          <p className={styles.episodeCode}>
                            E{String(ep.episodeNumber).padStart(2, '0')}
                            {ep.runtime ? ` · ${ep.runtime}min` : ''}
                          </p>
                          <p className={styles.episodeName}>{ep.name}</p>
                        </div>
                        <div
                          className={`${styles.checkCircle} ${ep.watched ? styles.checkCircleWatched : ''}`}
                          aria-hidden="true"
                        >
                          <IconCheck width={14} height={14} />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
