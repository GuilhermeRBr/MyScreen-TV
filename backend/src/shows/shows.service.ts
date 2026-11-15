import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { TmdbService } from '../tmdb/tmdb.service';
import { SHOWS_MESSAGES } from './messages/shows.messages';
import { QUEUE_NAMES } from '../queue/queue.constants';
import { SHOW_SYNC_JOB_NAMES, SyncSeasonsPayload } from './jobs/show-sync.job';

@Injectable()
export class ShowsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tmdb: TmdbService,
    @InjectQueue(QUEUE_NAMES.SHOW_SYNC)
    private readonly showSyncQueue: Queue<SyncSeasonsPayload>,
  ) {}

  async getShowDetail(tmdbId: number) {
    // Sincroniza só o show e o elenco (rápido — 2 chamadas à TMDB em paralelo).
    // As temporadas/episódios são enfileirados para processamento em background.
    const { show, pendingSeasonNumbers } =
      await this.tmdb.upsertShowShallow(tmdbId);

    if (pendingSeasonNumbers.length > 0) {
      await this.showSyncQueue.add(
        SHOW_SYNC_JOB_NAMES.SYNC_SEASONS,
        { showId: show.id, showTmdbId: tmdbId, seasonNumbers: pendingSeasonNumbers },
        // jobId determinístico: evita enfileirar o mesmo show duas vezes
        // quando dois usuários abrem a mesma série nova simultaneamente.
        { jobId: `sync-seasons-${tmdbId}` },
      );
    }

    const [cast, seasons] = await Promise.all([
      this.prisma.showCast.findMany({
        where: { showId: show.id },
        include: { cast: true },
        orderBy: { order: 'asc' },
        take: 20,
      }),
      this.prisma.season.findMany({
        where: { showId: show.id },
        select: { episodeCount: true },
      }),
    ]);

    const numberOfSeasons = seasons.length;
    const numberOfEpisodes = seasons.reduce((acc, s) => acc + s.episodeCount, 0);

    return {
      ...show,
      numberOfSeasons,
      numberOfEpisodes,
      cast: cast.map((sc) => ({
        id: sc.cast.id,
        name: sc.cast.name,
        profilePath: sc.cast.profilePath,
        character: sc.character,
        order: sc.order,
      })),
    };
  }

  async getShowSeasons(tmdbId: number) {
    const show = await this.prisma.show.findUnique({ where: { tmdbId } });

    if (!show) {
      throw new NotFoundException(SHOWS_MESSAGES.SHOW_NOT_FOUND);
    }

    return this.prisma.season.findMany({
      where: { showId: show.id },
      orderBy: { seasonNumber: 'asc' },
    });
  }

  async getSeasonEpisodes(tmdbId: number, seasonNumber: number) {
    const show = await this.prisma.show.findUnique({ where: { tmdbId } });

    if (!show) {
      throw new NotFoundException(SHOWS_MESSAGES.SHOW_NOT_FOUND);
    }

    const season = await this.prisma.season.findUnique({
      where: { showId_seasonNumber: { showId: show.id, seasonNumber } },
      include: {
        episodes: { orderBy: { episodeNumber: 'asc' } },
      },
    });

    if (!season) {
      throw new NotFoundException(SHOWS_MESSAGES.SEASON_NOT_FOUND);
    }

    return season;
  }

  async getPopular(page = 1) {
    return this.tmdb.getPopularShows(page);
  }

  async getPopularFeed(page = 1) {
    return this.tmdb.getPopularShowsWithTrailers(page);
  }

  async getTrending() {
    return this.tmdb.getTrendingShows();
  }

  async search(query: string, page = 1) {
    return this.tmdb.searchShows(query, page);
  }

  async getRecommendations(tmdbId: number, page = 1) {
    return this.tmdb.getShowRecommendations(tmdbId, page);
  }
}
