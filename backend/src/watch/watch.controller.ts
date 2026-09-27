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

@ApiTags('Watch')
@ApiCookieAuth('access_token')
@Controller('watch')
@UseGuards(JwtAuthGuard)
export class WatchController {
  constructor(private readonly watchService: WatchService) {}

  @Post('episodes/toggle')
  @ApiOperation({
    summary: 'Marcar/desmarcar episódio como assistido',
    description: 'Alterna o estado de assistido de um episódio. Se já foi assistido, remove o registro; caso contrário, marca como assistido.',
  })
  @ApiResponse({ status: 201, description: 'Estado alternado. Retorna o novo estado.' })
  @ApiResponse({ status: 401, description: 'Não autenticado.' })
  @ApiResponse({ status: 404, description: 'Episódio não encontrado.' })
  toggleEpisode(
    @CurrentUser() user: JwtPayload,
    @Body() dto: ToggleEpisodeDto,
  ) {
    return this.watchService.toggleEpisodeWatched(user.sub, dto.episodeId);
  }

  @Post('seasons/:seasonId/mark-all')
  @ApiOperation({
    summary: 'Marcar temporada inteira como assistida',
    description: 'Marca todos os episódios de uma temporada como assistidos.',
  })
  @ApiParam({ name: 'seasonId', description: 'UUID da temporada', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiResponse({ status: 201, description: 'Todos os episódios marcados.' })
  @ApiResponse({ status: 401, description: 'Não autenticado.' })
  @ApiResponse({ status: 404, description: 'Temporada não encontrada.' })
  markSeasonWatched(
    @CurrentUser() user: JwtPayload,
    @Param('seasonId', ParseUUIDPipe) seasonId: string,
  ) {
    return this.watchService.markSeasonWatched(user.sub, seasonId);
  }

  @Get('shows/:showId/progress')
  @ApiOperation({
    summary: 'Progresso de uma série',
    description: 'Retorna quantos episódios foram assistidos por temporada e o total geral.',
  })
  @ApiParam({ name: 'showId', description: 'UUID da série', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiResponse({ status: 200, description: 'Progresso por temporada.' })
  @ApiResponse({ status: 401, description: 'Não autenticado.' })
  getShowProgress(
    @CurrentUser() user: JwtPayload,
    @Param('showId', ParseUUIDPipe) showId: string,
  ) {
    return this.watchService.getShowProgress(user.sub, showId);
  }

  @Post('movies/toggle')
  @ApiOperation({
    summary: 'Marcar/desmarcar filme como assistido',
    description: 'Alterna o estado de assistido de um filme.',
  })
  @ApiResponse({ status: 201, description: 'Estado alternado.' })
  @ApiResponse({ status: 401, description: 'Não autenticado.' })
  @ApiResponse({ status: 404, description: 'Filme não encontrado.' })
  toggleMovie(
    @CurrentUser() user: JwtPayload,
    @Body() dto: ToggleMovieDto,
  ) {
    return this.watchService.toggleMovieWatched(user.sub, dto.movieId);
  }

  @Post('movies/watchlist')
  @ApiOperation({
    summary: 'Adicionar filme à watchlist',
    description: 'Adiciona um filme à lista "quero assistir" do usuário.',
  })
  @ApiResponse({ status: 201, description: 'Filme adicionado à watchlist.' })
  @ApiResponse({ status: 401, description: 'Não autenticado.' })
  addToWatchlist(
    @CurrentUser() user: JwtPayload,
    @Body() dto: ToggleMovieDto,
  ) {
    return this.watchService.addToWatchlist(user.sub, dto.movieId);
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Estatísticas do usuário',
    description: 'Retorna episódios assistidos, tempo total de TV e filmes assistidos.',
  })
  @ApiResponse({ status: 200, description: 'Estatísticas de consumo.' })
  @ApiResponse({ status: 401, description: 'Não autenticado.' })
  getStats(@CurrentUser() user: JwtPayload) {
    return this.watchService.getUserStats(user.sub);
  }
}
