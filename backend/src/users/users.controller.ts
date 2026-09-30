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
import { USERS_SWAGGER } from './messages/users.swagger';

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
}
