import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ShowSubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
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
  totalMinutesWatched: number;
  totalMoviesWatched: number;
}

@Injectable()
export class WatchService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------------------------
  // Episódios
  // ---------------------------------------------------------------------------

  async toggleEpisodeWatched(
    userId: string,
    episodeId: string,
  ): Promise<{ watched: boolean }> {
    const episode = await this.prisma.episode.findUnique({
      where: { id: episodeId },
      select: { id: true },
    });

    if (!episode) {
      throw new NotFoundException(WATCH_MESSAGES.EPISODE_NOT_FOUND);
    }

    const existing = await this.prisma.watchProgress.findUnique({
      where: { userId_episodeId: { userId, episodeId } },
    });

    if (existing) {
      await this.prisma.watchProgress.delete({
        where: { id: existing.id },
      });
      return { watched: false };
    }

    await this.prisma.watchProgress.create({
      data: { userId, episodeId },
    });

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

    return { markedCount: toCreate.length };
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

  // ---------------------------------------------------------------------------
  // Stats
  // ---------------------------------------------------------------------------

  async getUserStats(userId: string): Promise<UserStats> {
    const [episodesWatched, moviesWatched] = await Promise.all([
      this.prisma.watchProgress.count({ where: { userId } }),
      this.prisma.movieWatch.count({
        where: { userId, status: 'WATCHED' },
      }),
    ]);

    const runtimeResult = await this.prisma.watchProgress.findMany({
      where: { userId },
      select: {
        episode: { select: { runtime: true } },
      },
    });

    const totalMinutes = runtimeResult.reduce((acc, row) => {
      return acc + (row.episode.runtime ?? 25);
    }, 0);

    return {
      totalEpisodesWatched: episodesWatched,
      totalMinutesWatched: totalMinutes,
      totalMoviesWatched: moviesWatched,
    };
  }

  // ---------------------------------------------------------------------------
  // Assinatura de série
  // ---------------------------------------------------------------------------

  async upsertShowSubscription(
    userId: string,
    showId: string,
    status: ShowSubscriptionStatus,
  ) {
    return this.prisma.userShowSubscription.upsert({
      where: { userId_showId: { userId, showId } },
      create: { userId, showId, status },
      update: { status },
    });
  }
}
