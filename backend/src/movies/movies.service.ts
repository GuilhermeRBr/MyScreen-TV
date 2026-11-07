import { Injectable } from '@nestjs/common';
import { TmdbService } from '../tmdb/tmdb.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MoviesService {
  constructor(
    private readonly tmdb: TmdbService,
    private readonly prisma: PrismaService,
  ) {}

  async getMovieDetail(tmdbId: number) {
    const movie = await this.tmdb.upsertMovie(tmdbId);

    const cast = await this.prisma.movieCast.findMany({
      where: { movieId: movie.id },
      orderBy: { order: 'asc' },
      take: 20,
      include: {
        cast: {
          select: { id: true, name: true, profilePath: true },
        },
      },
    });

    return {
      ...movie,
      cast: cast.map((mc) => ({
        id: mc.cast.id,
        name: mc.cast.name,
        profilePath: mc.cast.profilePath,
        character: mc.character,
      })),
    };
  }

  async getPopular(page = 1) {
    return this.tmdb.getPopularMovies(page);
  }

  async getPopularFeed(page = 1) {
    return this.tmdb.getPopularWithTrailers(page);
  }

  async getTrending() {
    return this.tmdb.getTrendingMoviesWithTrailers();
  }

  async search(query: string, page = 1) {
    return this.tmdb.searchMovies(query, page);
  }
}
