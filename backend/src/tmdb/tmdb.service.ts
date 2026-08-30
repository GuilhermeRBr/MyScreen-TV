import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { Env } from '../env.validation';
import { Show, Season, Episode, Movie, Cast } from '@prisma/client';

// Limite de cache: só re-sincroniza após 6 meses
const CACHE_TTL_MS = 6 * 30 * 24 * 60 * 60 * 1000;

interface TmdbShow {
  id: number;
  name: string;
  original_name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  last_air_date: string;
  status: string;
  networks: Array<{ name: string }>;
  genres: Array<{ name: string }>;
  vote_average: number;
  vote_count: number;
  episode_run_time: number[];
  seasons: Array<{
    id: number;
    season_number: number;
    name: string;
    overview: string;
    poster_path: string | null;
    air_date: string;
    episode_count: number;
  }>;
}

interface TmdbSeason {
  id: number;
  season_number: number;
  name: string;
  overview: string;
  poster_path: string | null;
  air_date: string;
  episodes: Array<{
    id: number;
    episode_number: number;
    name: string;
    overview: string;
    still_path: string | null;
    air_date: string;
    runtime: number | null;
  }>;
}

interface TmdbMovie {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  runtime: number | null;
  genres: Array<{ name: string }>;
  vote_average: number;
  vote_count: number;
}

interface TmdbCredits {
  cast: Array<{
    id: number;
    name: string;
    profile_path: string | null;
    character: string;
    order: number;
  }>;
}

interface TmdbSearchResult {
  results: Array<{
    id: number;
    name?: string;
    title?: string;
    poster_path: string | null;
    overview: string;
    media_type?: string;
  }>;
}

@Injectable()
export class TmdbService {
  private readonly logger = new Logger(TmdbService.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(
    private readonly config: ConfigService<Env>,
    private readonly prisma: PrismaService,
  ) {
    this.baseUrl = this.config.get<string>('TMDB_BASE_URL', { infer: true })!;
    this.apiKey = this.config.get<string>('TMDB_API_KEY', { infer: true })!;
  }

  // ---------------------------------------------------------------------------
  // Busca
  // ---------------------------------------------------------------------------

  async searchShows(query: string, page = 1): Promise<TmdbSearchResult> {
    return this.fetch<TmdbSearchResult>(
      `/search/tv?query=${encodeURIComponent(query)}&page=${page}&language=pt-BR`,
    );
  }

  async searchMovies(query: string, page = 1): Promise<TmdbSearchResult> {
    return this.fetch<TmdbSearchResult>(
      `/search/movie?query=${encodeURIComponent(query)}&page=${page}&language=pt-BR`,
    );
  }

  // ---------------------------------------------------------------------------
  // Upsert de Show (com controle de cache 6 meses)
  // ---------------------------------------------------------------------------

  async upsertShow(tmdbId: number): Promise<Show> {
    const existing = await this.prisma.show.findUnique({
      where: { tmdbId },
      select: { id: true, lastSyncedAt: true },
    });

    if (existing && this.isCacheValid(existing.lastSyncedAt)) {
      return this.prisma.show.findUniqueOrThrow({ where: { tmdbId } });
    }

    const tmdbShow = await this.fetch<TmdbShow>(
      `/tv/${tmdbId}?language=pt-BR&append_to_response=credits`,
    );

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
        network: tmdbShow.networks?.[0]?.name ?? null,
        genres: tmdbShow.genres.map((g) => g.name),
        voteAverage: tmdbShow.vote_average,
        voteCount: tmdbShow.vote_count,
        episodeRuntime: tmdbShow.episode_run_time?.[0] ?? null,
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
        network: tmdbShow.networks?.[0]?.name ?? null,
        genres: tmdbShow.genres.map((g) => g.name),
        voteAverage: tmdbShow.vote_average,
        voteCount: tmdbShow.vote_count,
        episodeRuntime: tmdbShow.episode_run_time?.[0] ?? null,
        lastSyncedAt: new Date(),
      },
    });

    // Sincroniza temporadas em background (sem bloquear resposta)
    this.syncSeasons(show.id, tmdbId, tmdbShow.seasons).catch((err: unknown) =>
      this.logger.error('Erro ao sincronizar temporadas', err),
    );

    return show;
  }

  // ---------------------------------------------------------------------------
  // Upsert de Temporada com episódios
  // ---------------------------------------------------------------------------

  async upsertSeason(showId: string, tmdbShowId: number, seasonNumber: number): Promise<Season> {
    const existingSeason = await this.prisma.season.findFirst({
      where: { showId, seasonNumber },
      select: { id: true, lastSyncedAt: true },
    });

    if (existingSeason && this.isCacheValid(existingSeason.lastSyncedAt)) {
      return this.prisma.season.findFirstOrThrow({ where: { showId, seasonNumber } });
    }

    const tmdbSeason = await this.fetch<TmdbSeason>(
      `/tv/${tmdbShowId}/season/${seasonNumber}?language=pt-BR`,
    );

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
        episodeCount: tmdbSeason.episodes?.length ?? 0,
        lastSyncedAt: new Date(),
      },
      update: {
        name: tmdbSeason.name,
        overview: tmdbSeason.overview,
        posterPath: tmdbSeason.poster_path,
        airDate: tmdbSeason.air_date ? new Date(tmdbSeason.air_date) : null,
        episodeCount: tmdbSeason.episodes?.length ?? 0,
        lastSyncedAt: new Date(),
      },
    });

    // Upsert episódios
    if (tmdbSeason.episodes?.length) {
      await Promise.all(
        tmdbSeason.episodes.map((ep) =>
          this.prisma.episode.upsert({
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
          }),
        ),
      );
    }

    return season;
  }

  // ---------------------------------------------------------------------------
  // Upsert de Movie
  // ---------------------------------------------------------------------------

  async upsertMovie(tmdbId: number): Promise<Movie> {
    const existing = await this.prisma.movie.findUnique({
      where: { tmdbId },
      select: { id: true, lastSyncedAt: true },
    });

    if (existing && this.isCacheValid(existing.lastSyncedAt)) {
      return this.prisma.movie.findUniqueOrThrow({ where: { tmdbId } });
    }

    const tmdbMovie = await this.fetch<TmdbMovie>(
      `/movie/${tmdbId}?language=pt-BR`,
    );

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
  // Créditos
  // ---------------------------------------------------------------------------

  async syncShowCredits(showId: string, tmdbShowId: number): Promise<void> {
    const credits = await this.fetch<TmdbCredits>(
      `/tv/${tmdbShowId}/credits?language=pt-BR`,
    );

    await Promise.all(
      credits.cast.slice(0, 20).map(async (member) => {
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
          where: { showId_castId: { showId, castId: cast.id } },
          create: {
            showId,
            castId: cast.id,
            character: member.character,
            order: member.order,
          },
          update: {
            character: member.character,
            order: member.order,
          },
        });
      }),
    );
  }

  // ---------------------------------------------------------------------------
  // Trending / Discover
  // ---------------------------------------------------------------------------

  async getTrendingShows(page = 1): Promise<TmdbSearchResult> {
    return this.fetch<TmdbSearchResult>(
      `/trending/tv/week?language=pt-BR&page=${page}`,
    );
  }

  async getTrendingMovies(page = 1): Promise<TmdbSearchResult> {
    return this.fetch<TmdbSearchResult>(
      `/trending/movie/week?language=pt-BR&page=${page}`,
    );
  }

  // ---------------------------------------------------------------------------
  // Utilitários privados
  // ---------------------------------------------------------------------------

  private async fetch<T>(path: string): Promise<T> {
    const url = `${this.baseUrl}${path}${path.includes('?') ? '&' : '?'}api_key=${this.apiKey}`;

    const response = await globalThis.fetch(url, {
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.status === 404) {
      throw new NotFoundException('Conteúdo não encontrado no TMDB');
    }

    if (!response.ok) {
      throw new Error(`Erro TMDB: ${response.status}`);
    }

    return response.json() as Promise<T>;
  }

  private isCacheValid(lastSyncedAt: Date | null): boolean {
    if (!lastSyncedAt) return false;
    return Date.now() - lastSyncedAt.getTime() < CACHE_TTL_MS;
  }

  private async syncSeasons(
    showId: string,
    tmdbShowId: number,
    seasons: TmdbShow['seasons'],
  ): Promise<void> {
    for (const s of seasons) {
      if (s.season_number === 0) continue; // Pula especiais/extras

      await this.upsertSeason(showId, tmdbShowId, s.season_number).catch(
        (err: unknown) =>
          this.logger.error(
            `Erro ao sincronizar temporada ${s.season_number}`,
            err,
          ),
      );
    }
  }
}
