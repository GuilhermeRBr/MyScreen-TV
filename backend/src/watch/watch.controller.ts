import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { WatchService } from './watch.service';
import { ToggleEpisodeDto } from './dto/toggle-episode.dto';
import { ToggleMovieDto } from './dto/toggle-movie.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@Controller('watch')
@UseGuards(JwtAuthGuard)
export class WatchController {
  constructor(private readonly watchService: WatchService) {}

  @Post('episodes/toggle')
  toggleEpisode(
    @CurrentUser() user: JwtPayload,
    @Body() dto: ToggleEpisodeDto,
  ) {
    return this.watchService.toggleEpisodeWatched(user.sub, dto.episodeId);
  }

  @Post('seasons/:seasonId/mark-all')
  markSeasonWatched(
    @CurrentUser() user: JwtPayload,
    @Param('seasonId', ParseUUIDPipe) seasonId: string,
  ) {
    return this.watchService.markSeasonWatched(user.sub, seasonId);
  }

  @Get('shows/:showId/progress')
  getShowProgress(
    @CurrentUser() user: JwtPayload,
    @Param('showId', ParseUUIDPipe) showId: string,
  ) {
    return this.watchService.getShowProgress(user.sub, showId);
  }

  @Post('movies/toggle')
  toggleMovie(
    @CurrentUser() user: JwtPayload,
    @Body() dto: ToggleMovieDto,
  ) {
    return this.watchService.toggleMovieWatched(user.sub, dto.movieId);
  }

  @Post('movies/watchlist')
  addToWatchlist(
    @CurrentUser() user: JwtPayload,
    @Body() dto: ToggleMovieDto,
  ) {
    return this.watchService.addToWatchlist(user.sub, dto.movieId);
  }

  @Get('stats')
  getStats(@CurrentUser() user: JwtPayload) {
    return this.watchService.getUserStats(user.sub);
  }
}
