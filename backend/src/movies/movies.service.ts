import { Injectable } from '@nestjs/common';
import { TmdbService } from '../tmdb/tmdb.service';

@Injectable()
export class MoviesService {
  constructor(private readonly tmdb: TmdbService) {}

  async getMovieDetail(tmdbId: number) {
    return this.tmdb.upsertMovie(tmdbId);
  }

  async getPopular(page = 1) {
    return this.tmdb.getPopularMovies(page);
  }

  async getTrending() {
    return this.tmdb.getTrendingMovies();
  }

  async search(query: string, page = 1) {
    return this.tmdb.searchMovies(query, page);
  }
}
