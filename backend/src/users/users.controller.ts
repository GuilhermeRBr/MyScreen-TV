import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiCookieAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { USERS_SWAGGER } from './messages/users.swagger';
import { UserRole } from '@prisma/client';

@ApiTags('Users')
@ApiCookieAuth('access_token')
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation(USERS_SWAGGER.getMyProfile.operation)
  @ApiResponse({ status: 200, description: USERS_SWAGGER.getMyProfile.responses[200] })
  @ApiResponse({ status: 401, description: USERS_SWAGGER.getMyProfile.responses[401] })
  getMyProfile(@CurrentUser() user: JwtPayload) {
    return this.usersService.getProfile(user.sub);
  }

  @Get('me/banner-images')
  @ApiOperation(USERS_SWAGGER.getBannerImages.operation)
  @ApiResponse({ status: 200, description: USERS_SWAGGER.getBannerImages.responses[200] })
  @ApiResponse({ status: 401, description: USERS_SWAGGER.getBannerImages.responses[401] })
  getBannerImages(@CurrentUser() user: JwtPayload) {
    return this.usersService.getBannerImages(user.sub);
  }

  @Patch('me')
  @ApiOperation(USERS_SWAGGER.updateProfile.operation)
  @ApiResponse({ status: 200, description: USERS_SWAGGER.updateProfile.responses[200] })
  @ApiResponse({ status: 400, description: USERS_SWAGGER.updateProfile.responses[400] })
  @ApiResponse({ status: 401, description: USERS_SWAGGER.updateProfile.responses[401] })
  updateProfile(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(user.sub, dto);
  }

  @Get(':username')
  @ApiOperation(USERS_SWAGGER.getPublicProfile.operation)
  @ApiParam({ name: 'username', example: 'joaosilva' })
  @ApiResponse({ status: 200, description: USERS_SWAGGER.getPublicProfile.responses[200] })
  @ApiResponse({ status: 404, description: USERS_SWAGGER.getPublicProfile.responses[404] })
  getPublicProfile(@Param('username') username: string) {
    return this.usersService.getPublicProfile(username);
  }

  @Post(':username/follow')
  @ApiOperation(USERS_SWAGGER.follow.operation)
  @ApiParam({ name: 'username', example: 'joaosilva' })
  @ApiResponse({ status: 201, description: USERS_SWAGGER.follow.responses[201] })
  @ApiResponse({ status: 400, description: USERS_SWAGGER.follow.responses[400] })
  @ApiResponse({ status: 404, description: USERS_SWAGGER.follow.responses[404] })
  follow(
    @CurrentUser() user: JwtPayload,
    @Param('username') username: string,
  ) {
    return this.usersService.follow(user.sub, username);
  }

  @Delete(':username/follow')
  @ApiOperation(USERS_SWAGGER.unfollow.operation)
  @ApiParam({ name: 'username', example: 'joaosilva' })
  @ApiResponse({ status: 200, description: USERS_SWAGGER.unfollow.responses[200] })
  @ApiResponse({ status: 404, description: USERS_SWAGGER.unfollow.responses[404] })
  unfollow(
    @CurrentUser() user: JwtPayload,
    @Param('username') username: string,
  ) {
    return this.usersService.unfollow(user.sub, username);
  }

  @Get('admin/list')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation(USERS_SWAGGER.adminListUsers.operation)
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1, description: 'Número da página (padrão: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 50, description: 'Usuários por página (padrão: 50, máximo: 100)' })
  @ApiResponse({ status: 200, description: USERS_SWAGGER.adminListUsers.responses[200] })
  @ApiResponse({ status: 403, description: USERS_SWAGGER.adminListUsers.responses[403] })
  adminListUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const parsedPage = Math.max(1, parseInt(page ?? '1', 10) || 1);
    const parsedLimit = Math.min(100, Math.max(1, parseInt(limit ?? '50', 10) || 50));
    return this.usersService.adminListUsers(parsedPage, parsedLimit);
  }

  @Patch('admin/:id/toggle-active')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation(USERS_SWAGGER.toggleUserActive.operation)
  @ApiParam({ name: 'id', description: 'UUID do usuário alvo', example: '550e8400-e29b-41d4-a716-446655440001' })
  @ApiResponse({ status: 200, description: USERS_SWAGGER.toggleUserActive.responses[200] })
  @ApiResponse({ status: 400, description: USERS_SWAGGER.toggleUserActive.responses[400] })
  @ApiResponse({ status: 403, description: USERS_SWAGGER.toggleUserActive.responses[403] })
  @ApiResponse({ status: 404, description: USERS_SWAGGER.toggleUserActive.responses[404] })
  toggleUserActive(
    @CurrentUser() admin: JwtPayload,
    @Param('id', ParseUUIDPipe) targetUserId: string,
  ) {
    return this.usersService.toggleUserActive(admin.sub, targetUserId);
  }
}
