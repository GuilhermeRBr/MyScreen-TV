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
import { MoviesService } from './movies.service';

@ApiTags('Movies')
@Controller('movies')
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {}

  @Get('popular')
  @ApiOperation({ summary: 'Filmes populares', description: 'Retorna a lista de filmes populares via TMDB.' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Lista de filmes populares.' })
  getPopular(@Query('page', new ParseIntPipe({ optional: true })) page?: number) {
    return this.moviesService.getPopular(page ?? 1);
  }

  @Get('trending')
  @ApiOperation({ summary: 'Filmes em alta', description: 'Retorna os filmes em tendência da semana via TMDB.' })
  @ApiResponse({ status: 200, description: 'Lista de filmes em alta.' })
  getTrending() {
    return this.moviesService.getTrending();
  }

  @Get('search')
  @ApiOperation({ summary: 'Buscar filmes', description: 'Pesquisa filmes pelo nome via TMDB.' })
  @ApiQuery({ name: 'q', required: true, type: String, example: 'Inception' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Resultados da busca.' })
  search(
    @Query('q') query: string,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
  ) {
    return this.moviesService.search(query, page ?? 1);
  }

  @Get(':tmdbId')
  @ApiOperation({ summary: 'Detalhes de um filme', description: 'Retorna detalhes completos de um filme pelo ID do TMDB. Sincroniza com o banco se necessário.' })
  @ApiParam({ name: 'tmdbId', type: Number, example: 27205, description: 'ID do filme no TMDB' })
  @ApiResponse({ status: 200, description: 'Detalhes do filme.' })
  @ApiResponse({ status: 404, description: 'Filme não encontrado.' })
  getDetail(@Param('tmdbId', ParseIntPipe) tmdbId: number) {
    return this.moviesService.getMovieDetail(tmdbId);
  }
}
