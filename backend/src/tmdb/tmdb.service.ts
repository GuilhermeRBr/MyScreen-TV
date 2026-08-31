import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TmdbClient } from './tmdb.client';
import { Show, Season, Episode, Movie } from '@prisma/client';

// Cache de 6 meses conforme termos da TMDB
const SYNC_CACHE_MS = 6 * 30 * 24 * 60 * 60 * 1000;

@Injectable()
export class TmdbService {
  private readonly logger = new Logger(TmdbService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tmdb: TmdbClient,
  ) {}

  // ---------------------------------------------------------------------------
  // Shows
  // ---------------------------------------------------------------------------

  async upsertShow(tmdbId: number): Promise<Show> {
    const existing = await this.prisma.show.findUnique({
      where: { tmdbId },
    });

    if (existing && this.isFreshCache(existing.lastSyncedAt)) {
      return existing;
    }

    this.logger.log(`Sincronizando série tmdbId=${tmdbId}`);

    const [tmdbShow, tmdbCredits] = await Promise.all([
      this.tmdb.getShow(tmdbId),
      this.tmdb.getShowCredits(tmdbId),
    ]);

    const show = await this.prisma.show.upsert({
      where: { tmdbId },
      create: {
        tmdbId: tmdbShow.id,
        name: tmdbShow.name,
        originalName: tmdbShow.original_name,
        overview: tmdbShow.overview,
        posterPath: tmdbShow.poster_path,
        backdropPath: tmdbShow.backdrop_path,
        firstAirDate: tmdbShow.first_air_date
          ? new Date(tmdbShow.first_air_date)
          : null,
        lastAirDate: tmdbShow.last_air_date
          ? new Date(tmdbShow.last_air_date)
          : null,
        status: tmdbShow.status,
        network: tmdbShow.networks[0]?.name ?? null,
        genres: tmdbShow.genres.map((g) => g.name),
        voteAverage: tmdbShow.vote_average,
        voteCount: tmdbShow.vote_count,
        episodeRuntime: tmdbShow.episode_run_time[0] ?? null,
        lastSyncedAt: new Date(),
      },
      update: {
        name: tmdbShow.name,
        originalName: tmdbShow.original_name,
        overview: tmdbShow.overview,
        posterPath: tmdbShow.poster_path,
        backdropPath: tmdbShow.backdrop_path,
        firstAirDate: tmdbShow.first_air_date
          ? new Date(tmdbShow.first_air_date)
          : null,
        lastAirDate: tmdbShow.last_air_date
          ? new Date(tmdbShow.last_air_date)
          : null,
        status: tmdbShow.status,
        network: tmdbShow.networks[0]?.name ?? null,
        genres: tmdbShow.genres.map((g) => g.name),
        voteAverage: tmdbShow.vote_average,
        voteCount: tmdbShow.vote_count,
        episodeRuntime: tmdbShow.episode_run_time[0] ?? null,
        lastSyncedAt: new Date(),
      },
    });

    // Upsert elenco (top 20)
    const topCast = tmdbCredits.cast.slice(0, 20);
    for (const member of topCast) {
      const cast = await this.prisma.cast.upsert({
        where: { tmdbId: member.id },
        create: {
          tmdbId: member.id,
          name: member.name,
          profilePath: member.profile_path,
          lastSyncedAt: new Date(),
        },
        update: {
          name: member.name,
          profilePath: member.profile_path,
          lastSyncedAt: new Date(),
        },
      });

      await this.prisma.showCast.upsert({
        where: { showId_castId: { showId: show.id, castId: cast.id } },
        create: {
          showId: show.id,
          castId: cast.id,
          character: member.character,
          order: member.order,
        },
        update: {
          character: member.character,
          order: member.order,
        },
      });
    }

    // Upsert temporadas e episódios em paralelo
    await Promise.all(
      tmdbShow.seasons
        .filter((s) => s.season_number > 0)
        .map((s) => this.upsertSeason(show.id, tmdbId, s.season_number)),
    );

    return show;
  }

  async upsertSeason(
    showId: string,
    showTmdbId: number,
    seasonNumber: number,
  ): Promise<Season> {
    const existing = await this.prisma.season.findFirst({
      where: { showId, seasonNumber },
    });

    if (existing && this.isFreshCache(existing.lastSyncedAt)) {
      return existing;
    }

    const tmdbSeason = await this.tmdb.getSeason(showTmdbId, seasonNumber);

    const season = await this.prisma.season.upsert({
      where: { tmdbId: tmdbSeason.id },
      create: {
        showId,
        tmdbId: tmdbSeason.id,
        seasonNumber: tmdbSeason.season_number,
        name: tmdbSeason.name,
        overview: tmdbSeason.overview,
        posterPath: tmdbSeason.poster_path,
        airDate: tmdbSeason.air_date ? new Date(tmdbSeason.air_date) : null,
        episodeCount: tmdbSeason.episodes.length,
        lastSyncedAt: new Date(),
      },
      update: {
        name: tmdbSeason.name,
        overview: tmdbSeason.overview,
        posterPath: tmdbSeason.poster_path,
        airDate: tmdbSeason.air_date ? new Date(tmdbSeason.air_date) : null,
        episodeCount: tmdbSeason.episodes.length,
        lastSyncedAt: new Date(),
      },
    });

    // Upsert episódios
    for (const ep of tmdbSeason.episodes) {
      await this.prisma.episode.upsert({
        where: { tmdbId: ep.id },
        create: {
          seasonId: season.id,
          tmdbId: ep.id,
          episodeNumber: ep.episode_number,
          name: ep.name,
          overview: ep.overview,
          stillPath: ep.still_path,
          airDate: ep.air_date ? new Date(ep.air_date) : null,
          runtime: ep.runtime,
          lastSyncedAt: new Date(),
        },
        update: {
          name: ep.name,
          overview: ep.overview,
          stillPath: ep.still_path,
          airDate: ep.air_date ? new Date(ep.air_date) : null,
          runtime: ep.runtime,
          lastSyncedAt: new Date(),
        },
      });
    }

    return season;
  }

  // ---------------------------------------------------------------------------
  // Movies
  // ---------------------------------------------------------------------------

  async upsertMovie(tmdbId: number): Promise<Movie> {
    const existing = await this.prisma.movie.findUnique({
      where: { tmdbId },
    });

    if (existing && this.isFreshCache(existing.lastSyncedAt)) {
      return existing;
    }

    this.logger.log(`Sincronizando filme tmdbId=${tmdbId}`);

    const tmdbMovie = await this.tmdb.getMovie(tmdbId);

    return this.prisma.movie.upsert({
      where: { tmdbId },
      create: {
        tmdbId: tmdbMovie.id,
        title: tmdbMovie.title,
        originalTitle: tmdbMovie.original_title,
        overview: tmdbMovie.overview,
        posterPath: tmdbMovie.poster_path,
        backdropPath: tmdbMovie.backdrop_path,
        releaseDate: tmdbMovie.release_date
          ? new Date(tmdbMovie.release_date)
          : null,
        runtime: tmdbMovie.runtime,
        genres: tmdbMovie.genres.map((g) => g.name),
        voteAverage: tmdbMovie.vote_average,
        voteCount: tmdbMovie.vote_count,
        lastSyncedAt: new Date(),
      },
      update: {
        title: tmdbMovie.title,
        originalTitle: tmdbMovie.original_title,
        overview: tmdbMovie.overview,
        posterPath: tmdbMovie.poster_path,
        backdropPath: tmdbMovie.backdrop_path,
        releaseDate: tmdbMovie.release_date
          ? new Date(tmdbMovie.release_date)
          : null,
        runtime: tmdbMovie.runtime,
        genres: tmdbMovie.genres.map((g) => g.name),
        voteAverage: tmdbMovie.vote_average,
        voteCount: tmdbMovie.vote_count,
        lastSyncedAt: new Date(),
      },
    });
  }

  // ---------------------------------------------------------------------------
  // Busca (passa direto para a TMDB, sem persistir)
  // ---------------------------------------------------------------------------

  async searchShows(query: string, page = 1) {
    return this.tmdb.searchShows(query, page);
  }

  async searchMovies(query: string, page = 1) {
    return this.tmdb.searchMovies(query, page);
  }

  async getPopularShows(page = 1) {
    return this.tmdb.getPopularShows(page);
  }

  async getPopularMovies(page = 1) {
    return this.tmdb.getPopularMovies(page);
  }

  async getTrendingShows() {
    return this.tmdb.getTrendingShows();
  }

  async getTrendingMovies() {
    return this.tmdb.getTrendingMovies();
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private isFreshCache(lastSyncedAt: Date | null): boolean {
    if (!lastSyncedAt) return false;
    return Date.now() - lastSyncedAt.getTime() < SYNC_CACHE_MS;
  }
}
