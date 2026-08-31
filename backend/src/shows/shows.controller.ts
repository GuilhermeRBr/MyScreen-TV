import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ShowsService } from './shows.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('shows')
@UseGuards(JwtAuthGuard)
export class ShowsController {
  constructor(private readonly showsService: ShowsService) {}

  @Get('popular')
  getPopular(@Query('page', new ParseIntPipe({ optional: true })) page?: number) {
    return this.showsService.getPopular(page ?? 1);
  }

  @Get('trending')
  getTrending() {
    return this.showsService.getTrending();
  }

  @Get('search')
  search(
    @Query('q') query: string,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
  ) {
    return this.showsService.search(query, page ?? 1);
  }

  @Get(':tmdbId')
  getDetail(@Param('tmdbId', ParseIntPipe) tmdbId: number) {
    return this.showsService.getShowDetail(tmdbId);
  }

  @Get(':tmdbId/seasons')
  getSeasons(@Param('tmdbId', ParseIntPipe) tmdbId: number) {
    return this.showsService.getShowSeasons(tmdbId);
  }

  @Get(':tmdbId/seasons/:seasonNumber/episodes')
  getEpisodes(
    @Param('tmdbId', ParseIntPipe) tmdbId: number,
    @Param('seasonNumber', ParseIntPipe) seasonNumber: number,
  ) {
    return this.showsService.getSeasonEpisodes(tmdbId, seasonNumber);
  }
}
