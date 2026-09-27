import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiCookieAuth,
} from '@nestjs/swagger';
import { FeedService } from './feed.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@ApiTags('Feed')
@ApiCookieAuth('access_token')
@Controller('feed')
@UseGuards(JwtAuthGuard)
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  @Get('discover')
  @ApiOperation({
    summary: 'Descobrir conteúdo',
    description: 'Retorna séries e filmes em tendência para a tela de exploração. Não requer autenticação de contexto do usuário.',
  })
  @ApiResponse({ status: 200, description: 'Séries e filmes em tendência.' })
  @ApiResponse({ status: 401, description: 'Não autenticado.' })
  getDiscover() {
    return this.feedService.getDiscover();
  }

  @Get('upcoming')
  @ApiOperation({
    summary: 'Próximos episódios',
    description: 'Retorna os episódios dos próximos 30 dias das séries que o usuário está acompanhando.',
  })
  @ApiResponse({ status: 200, description: 'Lista de próximos episódios.' })
  @ApiResponse({ status: 401, description: 'Não autenticado.' })
  getUpcoming(@CurrentUser() user: JwtPayload) {
    return this.feedService.getUpcoming(user.sub);
  }

  @Get('continue-watching')
  @ApiOperation({
    summary: 'Continuar assistindo',
    description: 'Retorna o próximo episódio não assistido de cada série que o usuário está acompanhando.',
  })
  @ApiResponse({ status: 200, description: 'Lista de próximos episódios por série.' })
  @ApiResponse({ status: 401, description: 'Não autenticado.' })
  getContinueWatching(@CurrentUser() user: JwtPayload) {
    return this.feedService.getContinueWatching(user.sub);
  }
}
