import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TmdbService } from '../tmdb/tmdb.service';

@Injectable()
export class FeedService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tmdb: TmdbService,
  ) {}

  async getDiscover() {
    const [trendingShows, trendingMovies] = await Promise.all([
      this.tmdb.getTrendingShows(),
      this.tmdb.getTrendingMovies(),
    ]);

    return { trendingShows, trendingMovies };
  }

  async getUpcoming(userId: string) {
    // Busca episódios futuros das séries que o usuário segue (qualquer status)
    const subscriptions = await this.prisma.userShowSubscription.findMany({
      where: { userId },
      select: { showId: true },
    });

    const showIds = subscriptions.map((s) => s.showId);

    if (showIds.length === 0) {
      return [];
    }

    const now = new Date();
    const inThirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const episodes = await this.prisma.episode.findMany({
      where: {
        airDate: { gte: now, lte: inThirtyDays },
        season: { showId: { in: showIds } },
      },
      include: {
        season: {
          include: {
            show: {
              select: {
                id: true,
                tmdbId: true,
                name: true,
                posterPath: true,
                network: true,
              },
            },
          },
        },
      },
      orderBy: { airDate: 'asc' },
    });

    return episodes.map((ep) => ({
      episodeId: ep.id,
      showId: ep.season.show.id,
      showTmdbId: ep.season.show.tmdbId,
      showName: ep.season.show.name,
      posterPath: ep.season.show.posterPath,
      network: ep.season.show.network,
      seasonNumber: ep.season.seasonNumber,
      episodeNumber: ep.episodeNumber,
      episodeName: ep.name,
      airDate: ep.airDate,
    }));
  }

  async getUpcomingMovies(userId: string) {
    // Busca todos os filmes na watchlist do usuário com data de lançamento futura
    // Sem limite de janela — filmes podem estar meses à frente
    const now = new Date();

    const watches = await this.prisma.movieWatch.findMany({
      where: {
        userId,
        status: 'WATCHLIST',
        movie: {
          releaseDate: { gte: now },
        },
      },
      include: {
        movie: {
          select: {
            id: true,
            tmdbId: true,
            title: true,
            posterPath: true,
            releaseDate: true,
            genres: true,
            movieCasts: {
              take: 4,
              orderBy: { order: 'asc' },
              include: {
                cast: { select: { name: true } },
              },
            },
          },
        },
      },
      orderBy: {
        movie: { releaseDate: 'asc' },
      },
    });

    return watches.map((w) => ({
      movieId: w.movie.id,
      movieTmdbId: w.movie.tmdbId,
      title: w.movie.title,
      posterPath: w.movie.posterPath,
      releaseDate: w.movie.releaseDate,
      genres: w.movie.genres,
      cast: w.movie.movieCasts.map((mc) => mc.cast.name),
    }));
  }

  async getContinueWatching(userId: string) {
    const subscriptions = await this.prisma.userShowSubscription.findMany({
      where: {
        userId,
        status: { in: ['WATCHING', 'REWATCHING'] },
      },
      include: {
        show: {
          include: {
            seasons: {
              orderBy: { seasonNumber: 'asc' },
              include: {
                episodes: {
                  orderBy: { episodeNumber: 'asc' },
                  include: {
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
    });

    const result: Array<{
      showId: string;
      showName: string;
      posterPath: string | null;
      nextEpisode: {
        episodeId: string;
        seasonNumber: number;
        episodeNumber: number;
        episodeName: string;
        stillPath: string | null;
      };
    }> = [];

    for (const sub of subscriptions) {
      // Encontra o próximo episódio não assistido
      let nextEpisode = null;

      for (const season of sub.show.seasons) {
        for (const episode of season.episodes) {
          if (episode.watchProgresses.length === 0) {
            nextEpisode = {
              episodeId: episode.id,
              seasonNumber: season.seasonNumber,
              episodeNumber: episode.episodeNumber,
              episodeName: episode.name,
              stillPath: episode.stillPath,
            };
            break;
          }
        }
        if (nextEpisode) break;
      }

      if (nextEpisode) {
        result.push({
          showId: sub.show.id,
          showName: sub.show.name,
          posterPath: sub.show.posterPath,
          nextEpisode,
        });
      }
    }

    return result;
  }
}
