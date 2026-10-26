import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
  Delete,
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
import { UpsertShowSubscriptionDto } from './dto/upsert-show-subscription.dto';
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

  @Delete('seasons/:seasonId/mark-all')
  @ApiOperation(WATCH_SWAGGER.unmarkSeasonWatched.operation)
  @ApiParam({ name: 'seasonId', description: 'UUID da temporada', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiResponse({ status: 200, description: WATCH_SWAGGER.unmarkSeasonWatched.responses[200] })
  @ApiResponse({ status: 401, description: WATCH_SWAGGER.unmarkSeasonWatched.responses[401] })
  @ApiResponse({ status: 404, description: WATCH_SWAGGER.unmarkSeasonWatched.responses[404] })
  unmarkSeasonWatched(
    @CurrentUser() user: JwtPayload,
    @Param('seasonId', ParseUUIDPipe) seasonId: string,
  ) {
    return this.watchService.unmarkSeasonWatched(user.sub, seasonId);
  }

  @Get('shows/:showId/watched-episodes')
  @ApiOperation({
    summary: 'IDs dos episódios assistidos de uma série',
    description: 'Retorna a lista de IDs de episódios que o usuário assistiu para a série informada.',
  })
  @ApiParam({ name: 'showId', description: 'UUID interno da série' })
  @ApiResponse({ status: 200, description: 'Array de episodeId (strings).' })
  @ApiResponse({ status: 401, description: 'Não autenticado.' })
  async getWatchedEpisodeIds(
    @CurrentUser() user: JwtPayload,
    @Param('showId', ParseUUIDPipe) showId: string,
  ) {
    const ids = await this.watchService.getWatchedEpisodeIds(user.sub, showId);
    return { watchedEpisodeIds: [...ids] };
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

  @Get('movies/:movieId/status')
  @ApiOperation(WATCH_SWAGGER.getMovieStatus.operation)
  @ApiParam({ name: 'movieId', description: 'UUID interno do filme', example: '550e8400-e29b-41d4-a716-446655440001' })
  @ApiResponse({ status: 200, description: WATCH_SWAGGER.getMovieStatus.responses[200] })
  @ApiResponse({ status: 401, description: WATCH_SWAGGER.getMovieStatus.responses[401] })
  getMovieStatus(
    @CurrentUser() user: JwtPayload,
    @Param('movieId', ParseUUIDPipe) movieId: string,
  ) {
    return this.watchService.getMovieWatchStatus(user.sub, movieId);
  }

  @Delete('movies/:movieId')
  @ApiOperation(WATCH_SWAGGER.removeFromList.operation)
  @ApiParam({ name: 'movieId', description: 'UUID interno do filme', example: '550e8400-e29b-41d4-a716-446655440001' })
  @ApiResponse({ status: 200, description: WATCH_SWAGGER.removeFromList.responses[200] })
  @ApiResponse({ status: 401, description: WATCH_SWAGGER.removeFromList.responses[401] })
  @ApiResponse({ status: 404, description: WATCH_SWAGGER.removeFromList.responses[404] })
  removeFromList(
    @CurrentUser() user: JwtPayload,
    @Param('movieId', ParseUUIDPipe) movieId: string,
  ) {
    return this.watchService.removeMovieFromList(user.sub, movieId);
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

  @Get('movies')
  @ApiOperation(WATCH_SWAGGER.getUserMovies.operation)
  @ApiResponse({ status: 200, description: WATCH_SWAGGER.getUserMovies.responses[200] })
  @ApiResponse({ status: 401, description: WATCH_SWAGGER.getUserMovies.responses[401] })
  getUserMovies(@CurrentUser() user: JwtPayload) {
    return this.watchService.getUserMovieWatches(user.sub);
  }

  @Get('subscriptions')
  @ApiOperation(WATCH_SWAGGER.getUserSubscriptions.operation)
  @ApiResponse({ status: 200, description: WATCH_SWAGGER.getUserSubscriptions.responses[200] })
  @ApiResponse({ status: 401, description: WATCH_SWAGGER.getUserSubscriptions.responses[401] })
  getUserSubscriptions(@CurrentUser() user: JwtPayload) {
    return this.watchService.getUserShowSubscriptions(user.sub);
  }

  @Get('shows/:showId/subscription')
  @ApiOperation(WATCH_SWAGGER.getShowSubscriptionStatus.operation)
  @ApiParam({ name: 'showId', description: 'UUID interno da série', example: '550e8400-e29b-41d4-a716-446655440002' })
  @ApiResponse({ status: 200, description: WATCH_SWAGGER.getShowSubscriptionStatus.responses[200] })
  @ApiResponse({ status: 401, description: WATCH_SWAGGER.getShowSubscriptionStatus.responses[401] })
  getShowSubscriptionStatus(
    @CurrentUser() user: JwtPayload,
    @Param('showId', ParseUUIDPipe) showId: string,
  ) {
    return this.watchService.getShowSubscriptionStatus(user.sub, showId);
  }

  @Post('shows/subscribe')
  @ApiOperation(WATCH_SWAGGER.upsertShowSubscription.operation)
  @ApiResponse({ status: 201, description: WATCH_SWAGGER.upsertShowSubscription.responses[201] })
  @ApiResponse({ status: 401, description: WATCH_SWAGGER.upsertShowSubscription.responses[401] })
  @ApiResponse({ status: 404, description: WATCH_SWAGGER.upsertShowSubscription.responses[404] })
  upsertShowSubscription(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpsertShowSubscriptionDto,
  ) {
    return this.watchService.upsertShowSubscription(user.sub, dto.showId, dto.status);
  }

  @Delete('shows/:showId')
  @ApiOperation(WATCH_SWAGGER.removeShowSubscription.operation)
  @ApiParam({ name: 'showId', description: 'UUID interno da série', example: '550e8400-e29b-41d4-a716-446655440002' })
  @ApiResponse({ status: 200, description: WATCH_SWAGGER.removeShowSubscription.responses[200] })
  @ApiResponse({ status: 401, description: WATCH_SWAGGER.removeShowSubscription.responses[401] })
  @ApiResponse({ status: 404, description: WATCH_SWAGGER.removeShowSubscription.responses[404] })
  removeShowSubscription(
    @CurrentUser() user: JwtPayload,
    @Param('showId', ParseUUIDPipe) showId: string,
  ) {
    return this.watchService.removeShowSubscription(user.sub, showId);
  }
}
