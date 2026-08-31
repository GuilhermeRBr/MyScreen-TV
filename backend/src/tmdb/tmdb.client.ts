import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Env } from '../env.validation';
import {
  TmdbCredits,
  TmdbMovie,
  TmdbMovieSearchItem,
  TmdbSearchResult,
  TmdbSeason,
  TmdbShow,
  TmdbShowSearchItem,
} from './tmdb.types';

@Injectable()
export class TmdbClient {
  private readonly logger = new Logger(TmdbClient.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(private readonly config: ConfigService<Env>) {
    this.baseUrl = config.get<string>('TMDB_BASE_URL', { infer: true })!;
    this.apiKey = config.get<string>('TMDB_API_KEY', { infer: true })!;
  }

  async getShow(tmdbId: number): Promise<TmdbShow> {
    return this.get<TmdbShow>(`/tv/${tmdbId}`);
  }

  async getShowCredits(tmdbId: number): Promise<TmdbCredits> {
    return this.get<TmdbCredits>(`/tv/${tmdbId}/aggregate_credits`);
  }

  async getSeason(showTmdbId: number, seasonNumber: number): Promise<TmdbSeason> {
    return this.get<TmdbSeason>(`/tv/${showTmdbId}/season/${seasonNumber}`);
  }

  async getMovie(tmdbId: number): Promise<TmdbMovie> {
    return this.get<TmdbMovie>(`/movie/${tmdbId}`);
  }

  async getMovieCredits(tmdbId: number): Promise<TmdbCredits> {
    return this.get<TmdbCredits>(`/movie/${tmdbId}/credits`);
  }

  async searchShows(
    query: string,
    page = 1,
  ): Promise<TmdbSearchResult<TmdbShowSearchItem>> {
    return this.get<TmdbSearchResult<TmdbShowSearchItem>>('/search/tv', {
      query,
      page: String(page),
    });
  }

  async searchMovies(
    query: string,
    page = 1,
  ): Promise<TmdbSearchResult<TmdbMovieSearchItem>> {
    return this.get<TmdbSearchResult<TmdbMovieSearchItem>>('/search/movie', {
      query,
      page: String(page),
    });
  }

  async getPopularShows(page = 1): Promise<TmdbSearchResult<TmdbShowSearchItem>> {
    return this.get<TmdbSearchResult<TmdbShowSearchItem>>('/tv/popular', {
      page: String(page),
    });
  }

  async getPopularMovies(page = 1): Promise<TmdbSearchResult<TmdbMovieSearchItem>> {
    return this.get<TmdbSearchResult<TmdbMovieSearchItem>>('/movie/popular', {
      page: String(page),
    });
  }

  async getTrendingShows(): Promise<TmdbSearchResult<TmdbShowSearchItem>> {
    return this.get<TmdbSearchResult<TmdbShowSearchItem>>('/trending/tv/week');
  }

  async getTrendingMovies(): Promise<TmdbSearchResult<TmdbMovieSearchItem>> {
    return this.get<TmdbSearchResult<TmdbMovieSearchItem>>('/trending/movie/week');
  }

  private async get<T>(
    path: string,
    params: Record<string, string> = {},
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);
    url.searchParams.set('api_key', this.apiKey);
    url.searchParams.set('language', 'pt-BR');

    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    this.logger.debug(`TMDB GET ${path}`);

    const response = await fetch(url.toString());

    if (!response.ok) {
      this.logger.error(`TMDB erro ${response.status} para ${path}`);
      throw new Error(`TMDB API retornou ${response.status}`);
    }

    return response.json() as Promise<T>;
  }
}
