import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
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
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@ApiTags('Users')
@ApiCookieAuth('access_token')
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Meu perfil', description: 'Retorna os dados do usuário autenticado.' })
  @ApiResponse({ status: 200, description: 'Dados do perfil.' })
  @ApiResponse({ status: 401, description: 'Não autenticado.' })
  getMyProfile(@CurrentUser() user: JwtPayload) {
    return this.usersService.getProfile(user.sub);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Atualizar perfil', description: 'Atualiza nome de exibição, bio ou avatar do usuário autenticado.' })
  @ApiResponse({ status: 200, description: 'Perfil atualizado.' })
  @ApiResponse({ status: 401, description: 'Não autenticado.' })
  updateProfile(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(user.sub, dto);
  }

  @Get(':username')
  @ApiOperation({ summary: 'Perfil público', description: 'Retorna o perfil público de um usuário pelo username.' })
  @ApiParam({ name: 'username', example: 'joaosilva' })
  @ApiResponse({ status: 200, description: 'Perfil público.' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado.' })
  getPublicProfile(@Param('username') username: string) {
    return this.usersService.getPublicProfile(username);
  }

  @Post(':username/follow')
  @ApiOperation({ summary: 'Seguir usuário' })
  @ApiParam({ name: 'username', example: 'joaosilva' })
  @ApiResponse({ status: 201, description: 'Agora seguindo o usuário.' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado.' })
  follow(
    @CurrentUser() user: JwtPayload,
    @Param('username') username: string,
  ) {
    return this.usersService.follow(user.sub, username);
  }

  @Delete(':username/follow')
  @ApiOperation({ summary: 'Deixar de seguir usuário' })
  @ApiParam({ name: 'username', example: 'joaosilva' })
  @ApiResponse({ status: 200, description: 'Deixou de seguir.' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado.' })
  unfollow(
    @CurrentUser() user: JwtPayload,
    @Param('username') username: string,
  ) {
    return this.usersService.unfollow(user.sub, username);
  }
}
