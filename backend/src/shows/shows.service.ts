import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TmdbService } from '../tmdb/tmdb.service';
import { SHOWS_MESSAGES } from './messages/shows.messages';

@Injectable()
export class ShowsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tmdb: TmdbService,
  ) {}

  async findOrSync(tmdbId: number) {
    return this.tmdb.upsertShow(tmdbId);
  }

  async getShowDetail(tmdbId: number) {
    const show = await this.tmdb.upsertShow(tmdbId);

    const cast = await this.prisma.showCast.findMany({
      where: { showId: show.id },
      include: { cast: true },
      orderBy: { order: 'asc' },
      take: 20,
    });

    return {
      ...show,
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

  async getTrending() {
    return this.tmdb.getTrendingShows();
  }

  async search(query: string, page = 1) {
    return this.tmdb.searchShows(query, page);
  }
}
