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
  @ApiResponse({ status: 200, description: USERS_SWAGGER.adminListUsers.responses[200] })
  @ApiResponse({ status: 403, description: USERS_SWAGGER.adminListUsers.responses[403] })
  adminListUsers() {
    return this.usersService.adminListUsers();
  }
}
