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
import { MOVIES_SWAGGER } from './messages/movies.swagger';

@ApiTags('Movies')
@Controller('movies')
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {}

  @Get('popular')
  @ApiOperation(MOVIES_SWAGGER.getPopular.operation)
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiResponse({ status: 200, description: MOVIES_SWAGGER.getPopular.responses[200] })
  getPopular(@Query('page', new ParseIntPipe({ optional: true })) page?: number) {
    return this.moviesService.getPopular(page ?? 1);
  }

  @Get('trending')
  @ApiOperation(MOVIES_SWAGGER.getTrending.operation)
  @ApiResponse({ status: 200, description: MOVIES_SWAGGER.getTrending.responses[200] })
  getTrending() {
    return this.moviesService.getTrending();
  }

  @Get('search')
  @ApiOperation(MOVIES_SWAGGER.search.operation)
  @ApiQuery({ name: 'q', required: true, type: String, example: 'Inception' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiResponse({ status: 200, description: MOVIES_SWAGGER.search.responses[200] })
  search(
    @Query('q') query: string,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
  ) {
    return this.moviesService.search(query, page ?? 1);
  }

  @Get(':tmdbId')
  @ApiOperation(MOVIES_SWAGGER.getDetail.operation)
  @ApiParam({ name: 'tmdbId', type: Number, example: 27205, description: 'ID do filme no TMDB' })
  @ApiResponse({ status: 200, description: MOVIES_SWAGGER.getDetail.responses[200] })
  @ApiResponse({ status: 404, description: MOVIES_SWAGGER.getDetail.responses[404] })
  getDetail(@Param('tmdbId', ParseIntPipe) tmdbId: number) {
    return this.moviesService.getMovieDetail(tmdbId);
  }
}
