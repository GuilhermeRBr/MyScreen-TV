import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MoviesService } from './movies.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('movies')
@UseGuards(JwtAuthGuard)
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {}

  @Get('popular')
  getPopular(@Query('page', new ParseIntPipe({ optional: true })) page?: number) {
    return this.moviesService.getPopular(page ?? 1);
  }

  @Get('trending')
  getTrending() {
    return this.moviesService.getTrending();
  }

  @Get('search')
  search(
    @Query('q') query: string,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
  ) {
    return this.moviesService.search(query, page ?? 1);
  }

  @Get(':tmdbId')
  getDetail(@Param('tmdbId', ParseIntPipe) tmdbId: number) {
    return this.moviesService.getMovieDetail(tmdbId);
  }
}
