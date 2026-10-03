import {
  Controller,
  DefaultValuePipe,
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
import { SHOWS_SWAGGER } from './messages/shows.swagger';

@ApiTags('Shows')
@Controller('shows')
export class ShowsController {
  constructor(private readonly showsService: ShowsService) {}

  @Get('popular')
  @ApiOperation(SHOWS_SWAGGER.getPopular.operation)
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiResponse({ status: 200, description: SHOWS_SWAGGER.getPopular.responses[200] })
  getPopular(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
  ) {
    return this.showsService.getPopular(page);
  }

  @Get('trending')
  @ApiOperation(SHOWS_SWAGGER.getTrending.operation)
  @ApiResponse({ status: 200, description: SHOWS_SWAGGER.getTrending.responses[200] })
  getTrending() {
    return this.showsService.getTrending();
  }

  @Get('search')
  @ApiOperation(SHOWS_SWAGGER.search.operation)
  @ApiQuery({ name: 'q', required: true, type: String, example: 'Breaking Bad' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiResponse({ status: 200, description: SHOWS_SWAGGER.search.responses[200] })
  search(
    @Query('q') query: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
  ) {
    return this.showsService.search(query, page);
  }

  @Get(':tmdbId')
  @ApiOperation(SHOWS_SWAGGER.getDetail.operation)
  @ApiParam({ name: 'tmdbId', type: Number, example: 1396, description: 'ID da série no TMDB' })
  @ApiResponse({ status: 200, description: SHOWS_SWAGGER.getDetail.responses[200] })
  @ApiResponse({ status: 404, description: SHOWS_SWAGGER.getDetail.responses[404] })
  getDetail(@Param('tmdbId', ParseIntPipe) tmdbId: number) {
    return this.showsService.getShowDetail(tmdbId);
  }

  @Get(':tmdbId/seasons')
  @ApiOperation(SHOWS_SWAGGER.getSeasons.operation)
  @ApiParam({ name: 'tmdbId', type: Number, example: 1396 })
  @ApiResponse({ status: 200, description: SHOWS_SWAGGER.getSeasons.responses[200] })
  @ApiResponse({ status: 404, description: SHOWS_SWAGGER.getSeasons.responses[404] })
  getSeasons(@Param('tmdbId', ParseIntPipe) tmdbId: number) {
    return this.showsService.getShowSeasons(tmdbId);
  }

  @Get(':tmdbId/seasons/:seasonNumber/episodes')
  @ApiOperation(SHOWS_SWAGGER.getEpisodes.operation)
  @ApiParam({ name: 'tmdbId', type: Number, example: 1396 })
  @ApiParam({ name: 'seasonNumber', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: SHOWS_SWAGGER.getEpisodes.responses[200] })
  @ApiResponse({ status: 404, description: SHOWS_SWAGGER.getEpisodes.responses[404] })
  getEpisodes(
    @Param('tmdbId', ParseIntPipe) tmdbId: number,
    @Param('seasonNumber', ParseIntPipe) seasonNumber: number,
  ) {
    return this.showsService.getSeasonEpisodes(tmdbId, seasonNumber);
  }
}
