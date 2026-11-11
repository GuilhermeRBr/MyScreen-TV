'use client';

import { useEffect, useRef, useState } from 'react';
import type React from 'react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import styles from './page.module.css';
import { tmdbImage } from '@/lib/tmdb-image';
import { IconCheck, IconChevronDown } from '@/components/icons';
import { api } from '@/lib/api';
import { ConfirmMarkPreviousModal } from '@/components/ConfirmMarkPreviousModal/ConfirmMarkPreviousModal';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

interface Episode {
  id: string;
  episodeNumber: number;
  name: string;
  stillPath: string | null;
  runtime: number | null;
  airDate: string | null;
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
  airDate: string | null;
}

// ---------------------------------------------------------------------------
// Helpers de airDate
// ---------------------------------------------------------------------------

/**
 * Retorna quantos dias faltam para o lançamento de um episódio.
 * - null  → sem data cadastrada (considera lançado)
 * - 0     → lança hoje
 * - > 0   → dias restantes
 * - < 0   → já lançado
 */
function daysUntilAir(airDate: string | null): number | null {
  if (!airDate) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const air = new Date(airDate);
  air.setHours(0, 0, 0, 0);

  const diff = Math.round((air.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

function isUnreleased(airDate: string | null): boolean {
  const days = daysUntilAir(airDate);
  return days !== null && days > 0;
}

function formatDaysLabel(days: number): string {
  if (days === 0) return 'Hoje';
  if (days === 1) return '1 dia';
  return `${days} dias`;
}

// ---------------------------------------------------------------------------
// Página
// ---------------------------------------------------------------------------

// Nenhum limite — o carrossel exibe todos os episódios da série
export default function EpisodiosPage() {
  const params = useParams<{ id: string }>();
  const showId = params.id;

  const [seasons, setSeasons] = useState<SeasonWithEpisodes[]>([]);
  const [loading, setLoading] = useState(true);
  const [openSeasons, setOpenSeasons] = useState<Set<string>>(new Set());
  const [internalShowId, setInternalShowId] = useState<string | null>(null);

  // Modal "marcar anteriores"
  const [pendingEpisodeId, setPendingEpisodeId] = useState<string | null>(null);

  // Ref para o scroll do carrossel "continuar acompanhando"
  const continueScrollRef = useRef<HTMLDivElement>(null);
  const firstUnwatchedRef = useRef<HTMLButtonElement>(null);

  // Índice do primeiro não assistido fixado na carga inicial — não muda com toggles
  const anchorIndexRef = useRef<number>(-1);
  const scrolledRef = useRef(false);

  // ---- Carregamento inicial: temporadas + episódios + progresso em paralelo ----
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        // 1. Série (UUID interno) + temporadas em paralelo
        const [showData, rawSeasons] = await Promise.all([
          api.get<{ id: string }>(`/shows/${showId}`),
          api.get<RawSeason[]>(`/shows/${showId}/seasons`),
        ]);

        if (cancelled) return;

        setInternalShowId(showData.id);

        // 2. Progresso do usuário + todos os episódios de todas as temporadas + IDs assistidos em paralelo
        const [progress, watchedIdsRes, ...episodeResults] = await Promise.all([
          api.get<WatchProgressResponse>(`/watch/shows/${showData.id}/progress`).catch(() => null),
          api.get<{ watchedEpisodeIds: string[] }>(`/watch/shows/${showData.id}/watched-episodes`).catch(() => null),
          ...rawSeasons.map((s) =>
            api.get<{ episodes: RawEpisode[] }>(`/shows/${showId}/seasons/${s.seasonNumber}/episodes`)
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
  // Todos os episódios da série em ordem. O scroll começa posicionado no
  // primeiro não assistido; o usuário pode rolar livremente para qualquer lado.
  const allFlat: Array<{ episode: Episode; season: SeasonWithEpisodes }> = [];
  for (const season of seasons) {
    for (const ep of season.episodes) {
      allFlat.push({ episode: ep, season });
    }
  }

  // Fixa o índice de ancoragem na primeira vez que os dados chegam
  if (allFlat.length > 0 && anchorIndexRef.current === -1) {
    const firstUnwatched = allFlat.findIndex(({ episode }) => !episode.watched);
    anchorIndexRef.current = firstUnwatched === -1 ? 0 : firstUnwatched;
  }

  const anchorIndex = anchorIndexRef.current;

  // ---- Scroll automático até o ponto de ancoragem (só na carga inicial) ----
  useEffect(() => {
    if (scrolledRef.current) return;
    if (!continueScrollRef.current || !firstUnwatchedRef.current) return;

    const container = continueScrollRef.current;
    const target = firstUnwatchedRef.current;

    const timer = setTimeout(() => {
      const containerLeft = container.getBoundingClientRect().left;
      const targetLeft = target.getBoundingClientRect().left;
      const scrollOffset = targetLeft - containerLeft + container.scrollLeft;

      container.scrollTo({ left: scrollOffset, behavior: 'instant' });
      scrolledRef.current = true;
    }, 50);

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allFlat.length]); // dispara quando os episódios chegam pela primeira vez

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

  // ---- Scroll para o próximo não assistido após marcar um episódio ----
  const lastWatchedIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!lastWatchedIdRef.current) return;

    const container = continueScrollRef.current;
    if (!container) return;

    // Encontra o próximo não assistido após o último marcado
    const flat: Array<{ id: string; watched: boolean }> = [];
    for (const season of seasons) {
      for (const ep of season.episodes) {
        flat.push({ id: ep.id, watched: ep.watched });
      }
    }

    const markedIndex = flat.findIndex((e) => e.id === lastWatchedIdRef.current);
    if (markedIndex === -1) return;

    const nextUnwatched = flat.slice(markedIndex + 1).find((e) => !e.watched);
    if (!nextUnwatched) return;

    const targetIndex = flat.findIndex((e) => e.id === nextUnwatched.id);
    if (targetIndex === -1) return;

    const card = container.children[targetIndex] as HTMLElement | undefined;
    if (!card) return;

    const containerWidth = container.offsetWidth;
    const scrollTarget = card.offsetLeft - containerWidth / 2 + card.offsetWidth / 2;

    container.scrollTo({ left: scrollTarget, behavior: 'smooth' });
    lastWatchedIdRef.current = null;
  }, [seasons]);

  /**
   * Centraliza o card de um episódio no carrossel pelo seu índice em allFlat.
   */
  function scrollToEpisodeIndex(episodeId: string, updatedSeasons: SeasonWithEpisodes[]) {
    const container = continueScrollRef.current;
    if (!container) return;

    // Reconstrói o flat com o estado atualizado para encontrar o índice correto
    let flatIndex = 0;
    let targetIndex = -1;
    for (const season of updatedSeasons) {
      for (const ep of season.episodes) {
        if (ep.id === episodeId) {
          targetIndex = flatIndex;
          break;
        }
        flatIndex++;
      }
      if (targetIndex !== -1) break;
    }

    if (targetIndex === -1) return;

    const card = container.children[targetIndex] as HTMLElement | undefined;
    if (!card) return;

    const containerWidth = container.offsetWidth;
    const cardLeft = card.offsetLeft;
    const cardWidth = card.offsetWidth;
    const scrollTarget = cardLeft - containerWidth / 2 + cardWidth / 2;

    container.scrollTo({ left: scrollTarget, behavior: 'smooth' });
  }

  async function toggleEpisode(episodeId: string) {
    // Bloqueia marcar episódios que ainda não foram lançados
    const ep = seasons.flatMap((s) => s.episodes).find((e) => e.id === episodeId);
    if (ep && isUnreleased(ep.airDate)) return;

    try {
      const result = await api.post<{ watched: boolean }>(
        '/watch/episodes/toggle',
        { episodeId },
      );

      if (result.watched) {
        // Registra qual episódio foi marcado — o useEffect vai rolar após o render
        lastWatchedIdRef.current = episodeId;
      }

      setSeasons((prev) => {
        const next = prev.map((s) => {
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
        });
        return next;
      });

      // Verifica se há episódios anteriores não assistidos somente ao marcar
      if (result.watched) {
        const hasPrevious = hasPreviousUnwatchedEpisodes(episodeId, seasons);
        if (hasPrevious) {
          setPendingEpisodeId(episodeId);
        }
      }
    } catch {
      // falha silenciosa
    }
  }

  /**
   * Retorna true se existir ao menos um episódio anterior ao informado
   * (dentro da mesma temporada ou em temporadas anteriores) ainda não assistido.
   */
  function hasPreviousUnwatchedEpisodes(
    episodeId: string,
    currentSeasons: SeasonWithEpisodes[],
  ): boolean {
    for (const season of currentSeasons) {
      const epIndex = season.episodes.findIndex((e) => e.id === episodeId);

      if (epIndex === -1) {
        // Temporada anterior ao episódio clicado — qualquer não assistido conta
        if (season.episodes.some((e) => !e.watched)) return true;
        continue;
      }

      // Temporada do episódio clicado — apenas os que vêm antes na lista
      const previousInSeason = season.episodes.slice(0, epIndex);
      if (previousInSeason.some((e) => !e.watched)) return true;

      // Encontrou a temporada, não precisa continuar
      break;
    }

    return false;
  }

  async function markAllPreviousEpisodes(targetEpisodeId: string) {
    // Coleta os episódios a marcar: todos os anteriores ao alvo ainda não assistidos
    const toMarkBySeasonId = new Map<string, string[]>();

    for (const season of seasons) {
      const epIndex = season.episodes.findIndex((e) => e.id === targetEpisodeId);

      if (epIndex === -1) {
        // Temporada inteiramente anterior — marca os não assistidos
        const unwatched = season.episodes.filter((e) => !e.watched).map((e) => e.id);
        if (unwatched.length > 0) toMarkBySeasonId.set(season.id, unwatched);
        continue;
      }

      // Temporada do alvo — apenas os anteriores não assistidos
      const unwatched = season.episodes
        .slice(0, epIndex)
        .filter((e) => !e.watched)
        .map((e) => e.id);
      if (unwatched.length > 0) toMarkBySeasonId.set(season.id, unwatched);

      break;
    }

    // Usa mark-all para temporadas totalmente contidas; toggle individual para parciais
    for (const [seasonId, episodeIds] of toMarkBySeasonId) {
      const season = seasons.find((s) => s.id === seasonId);
      if (!season) continue;

      const allInSeason = season.episodes.filter((e) => !e.watched).map((e) => e.id);
      const isFullSeason =
        allInSeason.length > 0 &&
        allInSeason.every((id) => episodeIds.includes(id));

      if (isFullSeason) {
        await api.post(`/watch/seasons/${seasonId}/mark-all`);
      } else {
        for (const epId of episodeIds) {
          await api.post<{ watched: boolean }>('/watch/episodes/toggle', { episodeId: epId });
        }
      }
    }

    // Atualiza o estado local com os episódios marcados
    setSeasons((prev) =>
      prev.map((season) => {
        const markedIds = toMarkBySeasonId.get(season.id);
        if (!markedIds || markedIds.length === 0) return season;

        const updatedEps = season.episodes.map((e) =>
          markedIds.includes(e.id) ? { ...e, watched: true } : e,
        );
        return {
          ...season,
          episodes: updatedEps,
          watchedCount: updatedEps.filter((e) => e.watched).length,
        };
      }),
    );
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
      {pendingEpisodeId && (
        <ConfirmMarkPreviousModal
          onConfirm={async () => {
            const epId = pendingEpisodeId;
            setPendingEpisodeId(null);
            await markAllPreviousEpisodes(epId);
          }}
          onDecline={() => setPendingEpisodeId(null)}
        />
      )}

      {/* Continuar acompanhando */}
      {allFlat.length > 0 && (
        <section className={styles.continueSection}>
          <h2 className={styles.continueSectionTitle}>Continuar acompanhando</h2>
          <div className={styles.continueScroll} ref={continueScrollRef}>
            {allFlat.map(({ episode: ep, season: s }, index) => {
              const days = daysUntilAir(ep.airDate);
              const unreleased = days !== null && days > 0;

              return (
                <button
                  key={ep.id}
                  ref={index === anchorIndex ? firstUnwatchedRef : null}
                  className={`${styles.continueCard} ${ep.watched ? styles.continueCardWatched : ''} ${unreleased ? styles.continueCardUnreleased : ''}`}
                  onClick={() => !unreleased && toggleEpisode(ep.id)}
                  aria-label={unreleased ? `${ep.name} — disponível em ${formatDaysLabel(days)}` : `Marcar ${ep.name} como assistido`}
                  aria-disabled={unreleased}
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
                  <div className={styles.checkWrapper}>
                    {unreleased ? (
                      <span className={styles.daysLabel}>{formatDaysLabel(days)}</span>
                    ) : (
                      <div
                        className={`${styles.checkCircle} ${ep.watched ? styles.checkCircleWatched : ''}`}
                        aria-hidden="true"
                      >
                        <IconCheck width={14} height={14} />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
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
                  <IconChevronDown
                    width={20}
                    height={20}
                    className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}
                  />
                  <span className={styles.seasonCount}>{watched}/{total}</span>
                  <button
                    className={`${styles.seasonCheckCircle} ${isComplete ? styles.seasonCheckCircleComplete : styles.seasonCheckCircleIncomplete}`}
                    aria-label={isComplete ? `Desmarcar ${season.name} como assistida` : `Marcar ${season.name} como assistida`}
                    onClick={(e) => toggleSeasonWatched(season, e)}
                  >
                    <IconCheck width={14} height={14} />
                  </button>
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
                    {season.episodes.map((ep) => {
                      const days = daysUntilAir(ep.airDate);
                      const unreleased = days !== null && days > 0;

                      return (
                        <button
                          key={ep.id}
                          className={`${styles.episodeRow} ${unreleased ? styles.episodeRowUnreleased : ''}`}
                          onClick={() => !unreleased && toggleEpisode(ep.id)}
                          aria-label={unreleased ? `${ep.name} — disponível em ${formatDaysLabel(days)}` : `${ep.watched ? 'Desmarcar' : 'Marcar'} episódio ${ep.episodeNumber} como assistido`}
                          aria-disabled={unreleased}
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
                          <div className={styles.checkWrapper}>
                            {unreleased ? (
                              <span className={styles.daysLabel}>{formatDaysLabel(days)}</span>
                            ) : (
                              <div
                                className={`${styles.checkCircle} ${ep.watched ? styles.checkCircleWatched : ''}`}
                                aria-hidden="true"
                              >
                                <IconCheck width={14} height={14} />
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
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
