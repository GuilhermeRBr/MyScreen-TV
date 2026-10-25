'use client';

import { useEffect, useState, useCallback } from 'react';
import type React from 'react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import styles from './page.module.css';
import { tmdbImage } from '@/lib/tmdb-image';
import { IconCheck, IconChevronDown } from '@/components/icons';
import { api } from '@/lib/api';

interface Episode {
  id: string;
  episodeNumber: number;
  name: string;
  stillPath: string | null;
  runtime: number | null;
  watched?: boolean;
}

interface Season {
  id: string;
  seasonNumber: number;
  name: string;
  episodeCount: number;
  watchedCount?: number;
}

interface SeasonWithEpisodes extends Season {
  episodes: Episode[];
  loaded: boolean;
  loading: boolean;
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

export default function EpisodiosPage() {
  const params = useParams<{ id: string }>();
  const showId = params.id;

  const [seasons, setSeasons] = useState<SeasonWithEpisodes[]>([]);
  const [loadingSeasons, setLoadingSeasons] = useState(true);
  const [openSeasons, setOpenSeasons] = useState<Set<string>>(new Set());
  const [watchedIds, setWatchedIds] = useState<Set<string>>(new Set());
  const [internalShowId, setInternalShowId] = useState<string | null>(null);

  // Carrega lista de temporadas e progresso
  useEffect(() => {
    let cancelled = false;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

    async function load() {
      try {
        // Busca dados da série para obter o UUID interno
        const showRes = await fetch(`${apiUrl}/shows/${showId}`);
        if (!showRes.ok || cancelled) return;
        const show = await showRes.json() as { id: string };
        if (cancelled) return;
        setInternalShowId(show.id);

        // Temporadas
        const seasonsRes = await fetch(`${apiUrl}/shows/${showId}/seasons`);
        if (!seasonsRes.ok || cancelled) return;
        const rawSeasons = await seasonsRes.json() as Season[];
        if (cancelled) return;

        // Progresso do usuário (pode falhar sem auth)
        let progress: WatchProgressResponse | null = null;
        try {
          progress = await api.get<WatchProgressResponse>(
            `/watch/shows/${show.id}/progress`,
          );
        } catch {
          // sem autenticação — progresso fica zerado
        }

        const progressMap = new Map(
          progress?.seasons.map((s) => [s.seasonNumber, s.watchedCount]) ?? [],
        );

        setSeasons(
          rawSeasons.map((s) => ({
            ...s,
            watchedCount: progressMap.get(s.seasonNumber) ?? 0,
            episodes: [],
            loaded: false,
            loading: false,
          })),
        );
      } finally {
        if (!cancelled) setLoadingSeasons(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [showId]);

  const loadEpisodes = useCallback(
    async (season: SeasonWithEpisodes) => {
      if (season.loaded || season.loading) return;

      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

      setSeasons((prev) =>
        prev.map((s) =>
          s.id === season.id ? { ...s, loading: true } : s,
        ),
      );

      try {
        const res = await fetch(
          `${apiUrl}/shows/${showId}/seasons/${season.seasonNumber}/episodes`,
          { cache: 'no-store' },
        );
        if (!res.ok) return;
        const data = await res.json() as { episodes: Episode[] };
        const episodes: Episode[] = data.episodes ?? [];

        // Marca quais estão assistidos com base no watchedIds atual
        setSeasons((prev) =>
          prev.map((s) =>
            s.id === season.id
              ? {
                  ...s,
                  episodes: episodes.map((ep) => ({
                    ...ep,
                    watched: watchedIds.has(ep.id),
                  })),
                  loaded: true,
                  loading: false,
                }
              : s,
          ),
        );
      } catch {
        setSeasons((prev) =>
          prev.map((s) =>
            s.id === season.id ? { ...s, loading: false } : s,
          ),
        );
      }
    },
    [showId, watchedIds],
  );

  function toggleSeason(season: SeasonWithEpisodes) {
    const next = new Set(openSeasons);
    if (next.has(season.id)) {
      next.delete(season.id);
    } else {
      next.add(season.id);
      loadEpisodes(season);
    }
    setOpenSeasons(next);
  }

  async function toggleEpisode(episodeId: string) {
    try {
      const result = await api.post<{ watched: boolean }>(
        '/watch/episodes/toggle',
        { episodeId },
      );

      setWatchedIds((prev) => {
        const next = new Set(prev);
        if (result.watched) next.add(episodeId);
        else next.delete(episodeId);
        return next;
      });

      // Atualiza estado local dos episódios e contagem
      setSeasons((prev) =>
        prev.map((s) => {
          const epIdx = s.episodes.findIndex((e) => e.id === episodeId);
          if (epIdx === -1) return s;

          const updatedEpisodes = s.episodes.map((e) =>
            e.id === episodeId ? { ...e, watched: result.watched } : e,
          );
          const newWatchedCount = updatedEpisodes.filter((e) => e.watched).length;

          return { ...s, episodes: updatedEpisodes, watchedCount: newWatchedCount };
        }),
      );
    } catch {
      // falha silenciosa — o estado visual não muda
    }
  }

  async function toggleSeasonWatched(season: SeasonWithEpisodes, e: React.MouseEvent) {
    // Impede que o clique no check abra/feche o acordeão
    e.stopPropagation();

    const isComplete = (season.watchedCount ?? 0) >= season.episodeCount && season.episodeCount > 0;

    try {
      if (isComplete) {
        await api.delete(`/watch/seasons/${season.id}/mark-all`);

        setSeasons((prev) =>
          prev.map((s) =>
            s.id === season.id
              ? {
                  ...s,
                  watchedCount: 0,
                  episodes: s.episodes.map((ep) => ({ ...ep, watched: false })),
                }
              : s,
          ),
        );

        const epIds = season.episodes.map((e) => e.id);
        setWatchedIds((prev) => {
          const next = new Set(prev);
          epIds.forEach((id) => next.delete(id));
          return next;
        });
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

        const epIds = season.episodes.map((e) => e.id);
        setWatchedIds((prev) => {
          const next = new Set(prev);
          epIds.forEach((id) => next.add(id));
          return next;
        });
      }
    } catch {
      // falha silenciosa
    }
  }

  async function toggleAllWatched() {
    if (!internalShowId) return;

    try {
      if (allWatched) {
        // Desmarca todas as temporadas
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
        setWatchedIds(new Set());
      } else {
        // Marca todas as temporadas
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

        const allEpIds = seasons.flatMap((s) => s.episodes.map((ep) => ep.id));
        setWatchedIds((prev) => {
          const next = new Set(prev);
          allEpIds.forEach((id) => next.add(id));
          return next;
        });
      }
    } catch {
      // falha silenciosa
    }
  }

  // Episódio para "continuar acompanhando" — primeiro não assistido da primeira temporada com eps carregados
  const firstLoadedSeason = seasons.find((s) => s.loaded && s.episodes.length > 0);
  const continueEpisode = firstLoadedSeason?.episodes.find((e) => !e.watched);

  const totalWatched = seasons.reduce((acc, s) => acc + (s.watchedCount ?? 0), 0);
  const totalEpisodes = seasons.reduce((acc, s) => acc + s.episodeCount, 0);
  const allWatched = totalEpisodes > 0 && totalWatched === totalEpisodes;

  if (loadingSeasons) {
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
      {continueEpisode && firstLoadedSeason && (
        <section className={styles.continueSection}>
          <h2 className={styles.continueSectionTitle}>
            Continuar acompanhando
          </h2>
          <div className={styles.continueScroll}>
            <button
              className={styles.continueCard}
              onClick={() => toggleEpisode(continueEpisode.id)}
              aria-label={`Marcar ${continueEpisode.name} como assistido`}
            >
              <div className={styles.continueStill}>
                {continueEpisode.stillPath && (
                  <Image
                    src={tmdbImage(continueEpisode.stillPath, 'w185') ?? ''}
                    alt={continueEpisode.name}
                    fill
                    className={styles.continueStillImage}
                  />
                )}
              </div>
              <div className={styles.continueInfo}>
                <p className={styles.continueCode}>
                  T{String(firstLoadedSeason.seasonNumber).padStart(2, '0')} | E{String(continueEpisode.episodeNumber).padStart(2, '0')}
                </p>
                <p className={styles.continueName}>{continueEpisode.name}</p>
              </div>
              <div
                className={`${styles.checkCircle} ${continueEpisode.watched ? styles.checkCircleWatched : ''}`}
                aria-hidden="true"
              >
                <IconCheck width={14} height={14} />
              </div>
            </button>
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
            const watched = season.watchedCount ?? 0;
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
                  onClick={() => toggleSeason(season)}
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

                <div
                  className={styles.progressBarSeason}
                  aria-hidden="true"
                >
                  <div
                    className={styles.progressBarFill}
                    style={{ width: `${percent}%` }}
                  />
                </div>

                {/* Lista de episódios */}
                {isOpen && (
                  <div
                    id={`season-episodes-${season.id}`}
                    className={styles.episodeList}
                  >
                    {season.loading && (
                      <div className={styles.episodeListLoading}>
                        {Array.from({ length: 3 }).map((_, i) => (
                          <div key={i} className={styles.skeletonEpisode} aria-hidden="true" />
                        ))}
                      </div>
                    )}

                    {season.loaded && season.episodes.map((ep) => (
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
