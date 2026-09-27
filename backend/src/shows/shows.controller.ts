import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { ShowsService } from './shows.service';

@ApiTags('Shows')
@Controller('shows')
export class ShowsController {
  constructor(private readonly showsService: ShowsService) {}

  @Get('popular')
  @ApiOperation({ summary: 'Séries populares', description: 'Retorna a lista de séries populares via TMDB.' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Lista de séries populares.' })
  getPopular(@Query('page', new ParseIntPipe({ optional: true })) page?: number) {
    return this.showsService.getPopular(page ?? 1);
  }

  @Get('trending')
  @ApiOperation({ summary: 'Séries em alta', description: 'Retorna as séries em tendência da semana via TMDB.' })
  @ApiResponse({ status: 200, description: 'Lista de séries em alta.' })
  getTrending() {
    return this.showsService.getTrending();
  }

  @Get('search')
  @ApiOperation({ summary: 'Buscar séries', description: 'Pesquisa séries pelo nome via TMDB.' })
  @ApiQuery({ name: 'q', required: true, type: String, example: 'Breaking Bad' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Resultados da busca.' })
  search(
    @Query('q') query: string,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
  ) {
    return this.showsService.search(query, page ?? 1);
  }

  @Get(':tmdbId')
  @ApiOperation({ summary: 'Detalhes de uma série', description: 'Retorna detalhes completos de uma série pelo ID do TMDB, incluindo elenco. Sincroniza com o banco se necessário.' })
  @ApiParam({ name: 'tmdbId', type: Number, example: 1396, description: 'ID da série no TMDB' })
  @ApiResponse({ status: 200, description: 'Detalhes da série.' })
  @ApiResponse({ status: 404, description: 'Série não encontrada.' })
  getDetail(@Param('tmdbId', ParseIntPipe) tmdbId: number) {
    return this.showsService.getShowDetail(tmdbId);
  }

  @Get(':tmdbId/seasons')
  @ApiOperation({ summary: 'Temporadas de uma série' })
  @ApiParam({ name: 'tmdbId', type: Number, example: 1396 })
  @ApiResponse({ status: 200, description: 'Lista de temporadas.' })
  @ApiResponse({ status: 404, description: 'Série não encontrada.' })
  getSeasons(@Param('tmdbId', ParseIntPipe) tmdbId: number) {
    return this.showsService.getShowSeasons(tmdbId);
  }

  @Get(':tmdbId/seasons/:seasonNumber/episodes')
  @ApiOperation({ summary: 'Episódios de uma temporada' })
  @ApiParam({ name: 'tmdbId', type: Number, example: 1396 })
  @ApiParam({ name: 'seasonNumber', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Lista de episódios da temporada.' })
  @ApiResponse({ status: 404, description: 'Série ou temporada não encontrada.' })
  getEpisodes(
    @Param('tmdbId', ParseIntPipe) tmdbId: number,
    @Param('seasonNumber', ParseIntPipe) seasonNumber: number,
  ) {
    return this.showsService.getSeasonEpisodes(tmdbId, seasonNumber);
  }
}
