import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiCookieAuth,
  ApiParam,
} from '@nestjs/swagger';
import { WatchService } from './watch.service';
import { ToggleEpisodeDto } from './dto/toggle-episode.dto';
import { ToggleMovieDto } from './dto/toggle-movie.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { WATCH_SWAGGER } from './messages/watch.swagger';

@ApiTags('Watch')
@ApiCookieAuth('access_token')
@Controller('watch')
@UseGuards(JwtAuthGuard)
export class WatchController {
  constructor(private readonly watchService: WatchService) {}

  @Post('episodes/toggle')
  @ApiOperation(WATCH_SWAGGER.toggleEpisode.operation)
  @ApiResponse({ status: 201, description: WATCH_SWAGGER.toggleEpisode.responses[201] })
  @ApiResponse({ status: 401, description: WATCH_SWAGGER.toggleEpisode.responses[401] })
  @ApiResponse({ status: 404, description: WATCH_SWAGGER.toggleEpisode.responses[404] })
  toggleEpisode(
    @CurrentUser() user: JwtPayload,
    @Body() dto: ToggleEpisodeDto,
  ) {
    return this.watchService.toggleEpisodeWatched(user.sub, dto.episodeId);
  }

  @Post('seasons/:seasonId/mark-all')
  @ApiOperation(WATCH_SWAGGER.markSeasonWatched.operation)
  @ApiParam({ name: 'seasonId', description: 'UUID da temporada', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiResponse({ status: 201, description: WATCH_SWAGGER.markSeasonWatched.responses[201] })
  @ApiResponse({ status: 401, description: WATCH_SWAGGER.markSeasonWatched.responses[401] })
  @ApiResponse({ status: 404, description: WATCH_SWAGGER.markSeasonWatched.responses[404] })
  markSeasonWatched(
    @CurrentUser() user: JwtPayload,
    @Param('seasonId', ParseUUIDPipe) seasonId: string,
  ) {
    return this.watchService.markSeasonWatched(user.sub, seasonId);
  }

  @Get('shows/:showId/progress')
  @ApiOperation(WATCH_SWAGGER.getShowProgress.operation)
  @ApiParam({ name: 'showId', description: 'UUID da série', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiResponse({ status: 200, description: WATCH_SWAGGER.getShowProgress.responses[200] })
  @ApiResponse({ status: 401, description: WATCH_SWAGGER.getShowProgress.responses[401] })
  getShowProgress(
    @CurrentUser() user: JwtPayload,
    @Param('showId', ParseUUIDPipe) showId: string,
  ) {
    return this.watchService.getShowProgress(user.sub, showId);
  }

  @Post('movies/toggle')
  @ApiOperation(WATCH_SWAGGER.toggleMovie.operation)
  @ApiResponse({ status: 201, description: WATCH_SWAGGER.toggleMovie.responses[201] })
  @ApiResponse({ status: 401, description: WATCH_SWAGGER.toggleMovie.responses[401] })
  @ApiResponse({ status: 404, description: WATCH_SWAGGER.toggleMovie.responses[404] })
  toggleMovie(
    @CurrentUser() user: JwtPayload,
    @Body() dto: ToggleMovieDto,
  ) {
    return this.watchService.toggleMovieWatched(user.sub, dto.movieId);
  }

  @Post('movies/watchlist')
  @ApiOperation(WATCH_SWAGGER.addToWatchlist.operation)
  @ApiResponse({ status: 201, description: WATCH_SWAGGER.addToWatchlist.responses[201] })
  @ApiResponse({ status: 401, description: WATCH_SWAGGER.addToWatchlist.responses[401] })
  addToWatchlist(
    @CurrentUser() user: JwtPayload,
    @Body() dto: ToggleMovieDto,
  ) {
    return this.watchService.addToWatchlist(user.sub, dto.movieId);
  }

  @Get('stats')
  @ApiOperation(WATCH_SWAGGER.getStats.operation)
  @ApiResponse({ status: 200, description: WATCH_SWAGGER.getStats.responses[200] })
  @ApiResponse({ status: 401, description: WATCH_SWAGGER.getStats.responses[401] })
  getStats(@CurrentUser() user: JwtPayload) {
    return this.watchService.getUserStats(user.sub);
  }
}
