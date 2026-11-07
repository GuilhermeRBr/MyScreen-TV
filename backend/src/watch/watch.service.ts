import { Injectable, NotFoundException } from '@nestjs/common';
import { ShowSubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TmdbService } from '../tmdb/tmdb.service';
import { WATCH_MESSAGES } from './messages/watch.messages';

export interface SeasonProgress {
  seasonId: string;
  seasonNumber: number;
  watchedCount: number;
  totalCount: number;
  isComplete: boolean;
}

export interface ShowProgress {
  showId: string;
  totalWatched: number;
  totalEpisodes: number;
  seasons: SeasonProgress[];
}

export interface UserStats {
  totalEpisodesWatched: number;
  totalMoviesWatched: number;
  totalMinutesWatched: number;
  seriesMinutesWatched: number;
  moviesMinutesWatched: number;
}

@Injectable()
export class WatchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tmdb: TmdbService,
  ) {}

  // ---------------------------------------------------------------------------
  // Episódios
  // ---------------------------------------------------------------------------

  async toggleEpisodeWatched(
    userId: string,
    episodeId: string,
  ): Promise<{ watched: boolean }> {
    const episode = await this.prisma.episode.findUnique({
      where: { id: episodeId },
      select: { id: true, season: { select: { showId: true } } },
    });

    if (!episode) {
      throw new NotFoundException(WATCH_MESSAGES.EPISODE_NOT_FOUND);
    }

    const showId = episode.season.showId;

    const existing = await this.prisma.watchProgress.findUnique({
      where: { userId_episodeId: { userId, episodeId } },
    });

    if (existing) {
      await this.prisma.watchProgress.delete({
        where: { id: existing.id },
      });

      // Se não sobrou nenhum episódio assistido, volta para PLAN_TO_WATCH
      await this.checkAndRevertWatching(userId, showId);

      return { watched: false };
    }

    await this.prisma.watchProgress.create({
      data: { userId, episodeId },
    });

    // Se não tem assinatura ou está como PLAN_TO_WATCH, muda para WATCHING
    await this.checkAndStartWatching(userId, showId);

    // Verifica se todos os episódios foram assistidos e encerra
    await this.checkAndCompleteShow(userId, showId);

    return { watched: true };
  }

  async markSeasonWatched(
    userId: string,
    seasonId: string,
  ): Promise<{ markedCount: number }> {
    const season = await this.prisma.season.findUnique({
      where: { id: seasonId },
      include: { episodes: { select: { id: true } } },
    });

    if (!season) {
      throw new NotFoundException(WATCH_MESSAGES.SEASON_NOT_FOUND);
    }

    const existingIds = await this.prisma.watchProgress
      .findMany({
        where: {
          userId,
          episodeId: { in: season.episodes.map((e) => e.id) },
        },
        select: { episodeId: true },
      })
      .then((rows) => new Set(rows.map((r) => r.episodeId)));

    const toCreate = season.episodes
      .filter((e) => !existingIds.has(e.id))
      .map((e) => ({ userId, episodeId: e.id }));

    await this.prisma.watchProgress.createMany({ data: toCreate });

    // Se não tem assinatura ou está como PLAN_TO_WATCH, muda para WATCHING
    await this.checkAndStartWatching(userId, season.showId);

    // Verifica se a série foi completamente assistida e atualiza o status
    await this.checkAndCompleteShow(userId, season.showId);

    return { markedCount: toCreate.length };
  }

  async unmarkSeasonWatched(
    userId: string,
    seasonId: string,
  ): Promise<{ removedCount: number }> {
    const season = await this.prisma.season.findUnique({
      where: { id: seasonId },
      include: { episodes: { select: { id: true } } },
    });

    if (!season) {
      throw new NotFoundException(WATCH_MESSAGES.SEASON_NOT_FOUND);
    }

    const { count } = await this.prisma.watchProgress.deleteMany({
      where: {
        userId,
        episodeId: { in: season.episodes.map((e) => e.id) },
      },
    });

    // Se não sobrou nenhum episódio assistido na série, volta para PLAN_TO_WATCH
    await this.checkAndRevertWatching(userId, season.showId);

    return { removedCount: count };
  }

  async getShowProgress(userId: string, showId: string): Promise<ShowProgress> {
    const seasons = await this.prisma.season.findMany({
      where: { showId },
      include: {
        episodes: {
          select: {
            id: true,
            watchProgresses: {
              where: { userId },
              select: { id: true },
            },
          },
        },
      },
      orderBy: { seasonNumber: 'asc' },
    });

    const seasonData: SeasonProgress[] = seasons.map((s) => {
      const total = s.episodes.length;
      const watched = s.episodes.filter(
        (e) => e.watchProgresses.length > 0,
      ).length;

      return {
        seasonId: s.id,
        seasonNumber: s.seasonNumber,
        watchedCount: watched,
        totalCount: total,
        isComplete: total > 0 && watched === total,
      };
    });

    const totalWatched = seasonData.reduce((acc, s) => acc + s.watchedCount, 0);
    const totalEpisodes = seasonData.reduce((acc, s) => acc + s.totalCount, 0);

    return { showId, totalWatched, totalEpisodes, seasons: seasonData };
  }

  async getWatchedEpisodeIds(
    userId: string,
    showId: string,
  ): Promise<Set<string>> {
    const rows = await this.prisma.watchProgress.findMany({
      where: {
        userId,
        episode: { season: { showId } },
      },
      select: { episodeId: true },
    });

    return new Set(rows.map((r) => r.episodeId));
  }

  // ---------------------------------------------------------------------------
  // Filmes
  // ---------------------------------------------------------------------------

  async removeMovieFromList(userId: string, movieId: string): Promise<void> {
    const existing = await this.prisma.movieWatch.findUnique({
      where: { userId_movieId: { userId, movieId } },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException(WATCH_MESSAGES.MOVIE_NOT_FOUND);
    }

    await this.prisma.movieWatch.delete({
      where: { id: existing.id },
    });
  }

  async toggleMovieWatched(
    userId: string,
    movieId: string,
  ): Promise<{ watched: boolean }> {
    const movie = await this.prisma.movie.findUnique({
      where: { id: movieId },
      select: { id: true },
    });

    if (!movie) {
      throw new NotFoundException(WATCH_MESSAGES.MOVIE_NOT_FOUND);
    }

    const existing = await this.prisma.movieWatch.findUnique({
      where: { userId_movieId: { userId, movieId } },
    });

    if (existing?.status === 'WATCHED') {
      await this.prisma.movieWatch.update({
        where: { id: existing.id },
        data: { status: 'WATCHLIST', watchedAt: null },
      });
      return { watched: false };
    }

    await this.prisma.movieWatch.upsert({
      where: { userId_movieId: { userId, movieId } },
      create: { userId, movieId, status: 'WATCHED', watchedAt: new Date() },
      update: { status: 'WATCHED', watchedAt: new Date() },
    });

    return { watched: true };
  }

  async addToWatchlist(userId: string, movieId: string): Promise<void> {
    const movie = await this.prisma.movie.findUnique({
      where: { id: movieId },
      select: { id: true },
    });

    if (!movie) {
      throw new NotFoundException(WATCH_MESSAGES.MOVIE_NOT_FOUND);
    }

    await this.prisma.movieWatch.upsert({
      where: { userId_movieId: { userId, movieId } },
      create: { userId, movieId, status: 'WATCHLIST' },
      update: {},
    });
  }

  async addMovieToWatchlistByTmdbId(userId: string, tmdbId: number): Promise<void> {
    const movie = await this.tmdb.upsertMovie(tmdbId);
    await this.prisma.movieWatch.upsert({
      where: { userId_movieId: { userId, movieId: movie.id } },
      create: { userId, movieId: movie.id, status: 'WATCHLIST' },
      update: {},
    });
  }

  async addShowToListByTmdbId(userId: string, tmdbId: number): Promise<void> {
    const show = await this.tmdb.upsertShow(tmdbId);
    await this.prisma.userShowSubscription.upsert({
      where: { userId_showId: { userId, showId: show.id } },
      create: { userId, showId: show.id, status: ShowSubscriptionStatus.PLAN_TO_WATCH },
      update: {},
    });
  }

  async getStatusByTmdbId(
    userId: string,
    tmdbId: number,
    mediaType: 'movie' | 'show',
  ): Promise<{ onList: boolean }> {
    if (mediaType === 'movie') {
      const movie = await this.prisma.movie.findUnique({
        where: { tmdbId },
        select: { id: true },
      });
      if (!movie) return { onList: false };
      const watch = await this.prisma.movieWatch.findUnique({
        where: { userId_movieId: { userId, movieId: movie.id } },
        select: { id: true },
      });
      return { onList: !!watch };
    } else {
      const show = await this.prisma.show.findUnique({
        where: { tmdbId },
        select: { id: true },
      });
      if (!show) return { onList: false };
      const sub = await this.prisma.userShowSubscription.findUnique({
        where: { userId_showId: { userId, showId: show.id } },
        select: { id: true },
      });
      return { onList: !!sub };
    }
  }

  async removeByTmdbId(
    userId: string,
    tmdbId: number,
    mediaType: 'movie' | 'show',
  ): Promise<void> {
    if (mediaType === 'movie') {
      const movie = await this.prisma.movie.findUnique({
        where: { tmdbId },
        select: { id: true },
      });
      if (!movie) return;
      await this.prisma.movieWatch.deleteMany({
        where: { userId, movieId: movie.id },
      });
    } else {
      const show = await this.prisma.show.findUnique({
        where: { tmdbId },
        select: { id: true },
      });
      if (!show) return;
      await this.prisma.userShowSubscription.deleteMany({
        where: { userId, showId: show.id },
      });
    }
  }

  async getBatchStatus(
    userId: string,
    items: Array<{ tmdbId: number; type: 'movie' | 'show' }>,
  ): Promise<Record<string, boolean>> {
    const movieTmdbIds = items.filter((i) => i.type === 'movie').map((i) => i.tmdbId);
    const showTmdbIds = items.filter((i) => i.type === 'show').map((i) => i.tmdbId);

    // Uma query por tipo — busca todos os registros relevantes de uma vez
    const [movies, shows, movieWatches, showSubs] = await Promise.all([
      movieTmdbIds.length > 0
        ? this.prisma.movie.findMany({
            where: { tmdbId: { in: movieTmdbIds } },
            select: { id: true, tmdbId: true },
          })
        : [],
      showTmdbIds.length > 0
        ? this.prisma.show.findMany({
            where: { tmdbId: { in: showTmdbIds } },
            select: { id: true, tmdbId: true },
          })
        : [],
      [] as { movieId: string }[],
      [] as { showId: string }[],
    ]);

    const movieIdMap = new Map(movies.map((m) => [m.tmdbId, m.id]));
    const showIdMap = new Map(shows.map((s) => [s.tmdbId, s.id]));

    const internalMovieIds = movies.map((m) => m.id);
    const internalShowIds = shows.map((s) => s.id);

    const [watchRows, subRows] = await Promise.all([
      internalMovieIds.length > 0
        ? this.prisma.movieWatch.findMany({
            where: { userId, movieId: { in: internalMovieIds } },
            select: { movieId: true },
          })
        : movieWatches,
      internalShowIds.length > 0
        ? this.prisma.userShowSubscription.findMany({
            where: { userId, showId: { in: internalShowIds } },
            select: { showId: true },
          })
        : showSubs,
    ]);

    const watchedMovieIds = new Set(watchRows.map((w) => w.movieId));
    const subscribedShowIds = new Set(subRows.map((s) => s.showId));

    const result: Record<string, boolean> = {};
    for (const item of items) {
      const key = `${item.type}-${item.tmdbId}`;
      if (item.type === 'movie') {
        const internalId = movieIdMap.get(item.tmdbId);
        result[key] = internalId ? watchedMovieIds.has(internalId) : false;
      } else {
        const internalId = showIdMap.get(item.tmdbId);
        result[key] = internalId ? subscribedShowIds.has(internalId) : false;
      }
    }

    return result;
  }

  async getMovieWatchStatus(
    userId: string,
    movieId: string,
  ): Promise<{ status: string | null; watchedAt: Date | null }> {
    const watch = await this.prisma.movieWatch.findUnique({
      where: { userId_movieId: { userId, movieId } },
      select: { status: true, watchedAt: true },
    });

    return {
      status: watch?.status ?? null,
      watchedAt: watch?.watchedAt ?? null,
    };
  }

  // ---------------------------------------------------------------------------
  // Stats
  // ---------------------------------------------------------------------------

  async getUserStats(userId: string): Promise<UserStats> {
    const [episodesWatched, moviesWatched, episodeRuntimeRows, movieRuntimeRows] =
      await Promise.all([
        this.prisma.watchProgress.count({ where: { userId } }),
        this.prisma.movieWatch.count({
          where: { userId, status: 'WATCHED' },
        }),
        this.prisma.watchProgress.findMany({
          where: { userId },
          select: { episode: { select: { runtime: true } } },
        }),
        this.prisma.movieWatch.findMany({
          where: { userId, status: 'WATCHED' },
          select: { movie: { select: { runtime: true } } },
        }),
      ]);

    const episodeMinutes = episodeRuntimeRows.reduce((acc, row) => {
      return acc + (row.episode.runtime ?? 25);
    }, 0);

    const movieMinutes = movieRuntimeRows.reduce((acc, row) => {
      return acc + (row.movie.runtime ?? 120);
    }, 0);

    return {
      totalEpisodesWatched: episodesWatched,
      totalMoviesWatched: moviesWatched,
      totalMinutesWatched: episodeMinutes + movieMinutes,
      seriesMinutesWatched: episodeMinutes,
      moviesMinutesWatched: movieMinutes,
    };
  }

  // ---------------------------------------------------------------------------
  // Listas do usuário
  // ---------------------------------------------------------------------------

  async getUserMovieWatches(userId: string) {
    const watches = await this.prisma.movieWatch.findMany({
      where: { userId },
      include: {
        movie: {
          select: {
            id: true,
            tmdbId: true,
            title: true,
            posterPath: true,
            releaseDate: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return watches.map((w) => ({
      status: w.status,
      watchedAt: w.watchedAt,
      movie: w.movie,
    }));
  }

  async getUserShowSubscriptions(userId: string) {
    const subscriptions = await this.prisma.userShowSubscription.findMany({
      where: { userId },
      include: {
        show: {
          select: {
            id: true,
            tmdbId: true,
            name: true,
            posterPath: true,
            status: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return subscriptions.map((s) => ({
      status: s.status,
      show: s.show,
    }));
  }

  /**
   * Retorna todas as assinaturas do usuário com o progresso de cada série
   * (total de episódios assistidos e total disponível).
   * Usado para separar séries iniciadas de não iniciadas na aba "Minha Lista".
   */
  async getSubscriptionsWithProgress(userId: string) {
    const subscriptions = await this.prisma.userShowSubscription.findMany({
      where: { userId },
      include: {
        show: {
          select: {
            id: true,
            tmdbId: true,
            name: true,
            posterPath: true,
            status: true,
            seasons: {
              select: {
                episodes: {
                  select: {
                    id: true,
                    watchProgresses: {
                      where: { userId },
                      select: { id: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return subscriptions.map((s) => {
      const allEpisodes = s.show.seasons.flatMap((season) => season.episodes);
      const totalEpisodes = allEpisodes.length;
      const totalWatched = allEpisodes.filter(
        (e) => e.watchProgresses.length > 0,
      ).length;

      return {
        status: s.status,
        show: {
          id: s.show.id,
          tmdbId: s.show.tmdbId,
          name: s.show.name,
          posterPath: s.show.posterPath,
          status: s.show.status,
        },
        progress: {
          totalWatched,
          totalEpisodes,
        },
      };
    });
  }

  // ---------------------------------------------------------------------------
  // Assinatura de série
  // ---------------------------------------------------------------------------

  async getShowSubscriptionStatus(
    userId: string,
    showId: string,
  ): Promise<{ status: ShowSubscriptionStatus | null }> {
    const sub = await this.prisma.userShowSubscription.findUnique({
      where: { userId_showId: { userId, showId } },
      select: { status: true },
    });

    return { status: sub?.status ?? null };
  }

  async upsertShowSubscription(
    userId: string,
    showId: string,
    status: ShowSubscriptionStatus,
  ) {
    const show = await this.prisma.show.findUnique({
      where: { id: showId },
      select: { id: true },
    });

    if (!show) {
      throw new NotFoundException(WATCH_MESSAGES.SHOW_NOT_FOUND);
    }

    // Se o usuário tem episódios assistidos e está tentando adicionar como PLAN_TO_WATCH,
    // promove automaticamente para WATCHING
    const adjustedStatus =
      status === 'PLAN_TO_WATCH'
        ? await this.getAdjustedStatusForExistingProgress(userId, showId)
        : status;

    return this.prisma.userShowSubscription.upsert({
      where: { userId_showId: { userId, showId } },
      create: { userId, showId, status: adjustedStatus },
      update: { status: adjustedStatus },
    });
  }

  async removeShowSubscription(userId: string, showId: string): Promise<void> {
    const existing = await this.prisma.userShowSubscription.findUnique({
      where: { userId_showId: { userId, showId } },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException(WATCH_MESSAGES.SHOW_SUBSCRIPTION_NOT_FOUND);
    }

    await this.prisma.userShowSubscription.delete({
      where: { id: existing.id },
    });
  }

  // ---------------------------------------------------------------------------
  // Helpers privados
  // ---------------------------------------------------------------------------

  /**
   * Quando o usuário marca o primeiro episódio como assistido e ainda não tem
   * assinatura ativa (ou está como PLAN_TO_WATCH), cria/atualiza a assinatura
   * para WATCHING automaticamente.
   */
  private async checkAndStartWatching(userId: string, showId: string): Promise<void> {
    const subscription = await this.prisma.userShowSubscription.findUnique({
      where: { userId_showId: { userId, showId } },
      select: { status: true },
    });

    // Já está em um status ativo de acompanhamento — não interfere
    if (
      subscription &&
      subscription.status !== 'PLAN_TO_WATCH'
    ) {
      return;
    }

    await this.prisma.userShowSubscription.upsert({
      where: { userId_showId: { userId, showId } },
      create: { userId, showId, status: 'WATCHING' },
      update: { status: 'WATCHING' },
    });
  }

  /**
   * Ao re-adicionar uma série como PLAN_TO_WATCH, verifica se o usuário já tem
   * episódios assistidos e promove o status para WATCHING automaticamente,
   * evitando que a série apareça em "Assistir a seguir" em vez de "Assistindo".
   */
  private async getAdjustedStatusForExistingProgress(
    userId: string,
    showId: string,
  ): Promise<ShowSubscriptionStatus> {
    const watchedCount = await this.prisma.watchProgress.count({
      where: {
        userId,
        episode: { season: { showId } },
      },
    });

    if (watchedCount === 0) {
      return 'PLAN_TO_WATCH';
    }

    const totalEpisodes = await this.prisma.episode.count({
      where: { season: { showId } },
    });

    if (totalEpisodes > 0 && watchedCount >= totalEpisodes) {
      return 'STOPPED';
    }

    return 'WATCHING';
  }

  /**
   * Quando o usuário remove episódios assistidos e não sobra nenhum,
   * reverte a assinatura de WATCHING/REWATCHING/STOPPED para PLAN_TO_WATCH,
   * para que a série saia da seção "Assistindo" e volte a "Assistir a seguir".
   */
  private async checkAndRevertWatching(userId: string, showId: string): Promise<void> {
    const subscription = await this.prisma.userShowSubscription.findUnique({
      where: { userId_showId: { userId, showId } },
      select: { status: true },
    });

    if (
      !subscription ||
      (subscription.status !== 'WATCHING' &&
        subscription.status !== 'REWATCHING' &&
        subscription.status !== 'STOPPED')
    ) {
      return;
    }

    const watchedCount = await this.prisma.watchProgress.count({
      where: {
        userId,
        episode: { season: { showId } },
      },
    });

    if (watchedCount === 0) {
      await this.prisma.userShowSubscription.update({
        where: { userId_showId: { userId, showId } },
        data: { status: 'PLAN_TO_WATCH' },
      });
    }
  }

  /**
   * Verifica se todos os episódios da série foram assistidos pelo usuário.
   * Se sim e o status atual for WATCHING ou REWATCHING, transiciona para STOPPED
   * para que a série saia da seção "assistindo".
   */
  private async checkAndCompleteShow(userId: string, showId: string): Promise<void> {
    const subscription = await this.prisma.userShowSubscription.findUnique({
      where: { userId_showId: { userId, showId } },
      select: { status: true },
    });

    // Só age se o usuário tiver a série como WATCHING ou REWATCHING
    if (
      !subscription ||
      (subscription.status !== 'WATCHING' && subscription.status !== 'REWATCHING')
    ) {
      return;
    }

    // Conta total de episódios da série vs. episódios assistidos
    const [totalEpisodes, watchedCount] = await Promise.all([
      this.prisma.episode.count({
        where: { season: { showId } },
      }),
      this.prisma.watchProgress.count({
        where: {
          userId,
          episode: { season: { showId } },
        },
      }),
    ]);

    if (totalEpisodes > 0 && watchedCount >= totalEpisodes) {
      await this.prisma.userShowSubscription.update({
        where: { userId_showId: { userId, showId } },
        data: { status: 'STOPPED' },
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Visto por último
  // ---------------------------------------------------------------------------

  async getRecentlyWatched(userId: string, limit = 20) {
    const [episodeRows, movieRows] = await Promise.all([
      this.prisma.watchProgress.findMany({
        where: { userId },
        orderBy: { watchedAt: 'desc' },
        take: limit,
        select: {
          watchedAt: true,
          episode: {
            select: {
              season: {
                select: {
                  show: {
                    select: {
                      id: true,
                      tmdbId: true,
                      name: true,
                      posterPath: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
      this.prisma.movieWatch.findMany({
        where: { userId, status: 'WATCHED' },
        orderBy: { watchedAt: 'desc' },
        take: limit,
        select: {
          watchedAt: true,
          movie: {
            select: {
              id: true,
              tmdbId: true,
              title: true,
              posterPath: true,
            },
          },
        },
      }),
    ]);

    type RecentItem =
      | {
          type: 'show';
          watchedAt: Date;
          show: { id: string; tmdbId: number; name: string; posterPath: string | null };
        }
      | {
          type: 'movie';
          watchedAt: Date;
          movie: { id: string; tmdbId: number; title: string; posterPath: string | null };
        };

    const showItems: RecentItem[] = episodeRows
      .filter((r) => r.watchedAt !== null)
      .map((r) => ({
        type: 'show' as const,
        watchedAt: r.watchedAt as Date,
        show: r.episode.season.show,
      }));

    const movieItems: RecentItem[] = movieRows
      .filter((r) => r.watchedAt !== null)
      .map((r) => ({
        type: 'movie' as const,
        watchedAt: r.watchedAt as Date,
        movie: r.movie,
      }));

    // Mescla e ordena por data mais recente, removendo shows duplicados
    const seenShowIds = new Set<string>();
    const combined: RecentItem[] = [];

    for (const item of [...showItems, ...movieItems].sort(
      (a, b) => b.watchedAt.getTime() - a.watchedAt.getTime(),
    )) {
      if (item.type === 'show') {
        if (seenShowIds.has(item.show.id)) continue;
        seenShowIds.add(item.show.id);
      }
      combined.push(item);
      if (combined.length >= limit) break;
    }

    return combined;
  }
}
