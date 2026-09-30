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
import { FEED_SWAGGER } from './messages/feed.swagger';

@ApiTags('Feed')
@ApiCookieAuth('access_token')
@Controller('feed')
@UseGuards(JwtAuthGuard)
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  @Get('discover')
  @ApiOperation(FEED_SWAGGER.getDiscover.operation)
  @ApiResponse({ status: 200, description: FEED_SWAGGER.getDiscover.responses[200] })
  @ApiResponse({ status: 401, description: FEED_SWAGGER.getDiscover.responses[401] })
  getDiscover() {
    return this.feedService.getDiscover();
  }

  @Get('upcoming')
  @ApiOperation(FEED_SWAGGER.getUpcoming.operation)
  @ApiResponse({ status: 200, description: FEED_SWAGGER.getUpcoming.responses[200] })
  @ApiResponse({ status: 401, description: FEED_SWAGGER.getUpcoming.responses[401] })
  getUpcoming(@CurrentUser() user: JwtPayload) {
    return this.feedService.getUpcoming(user.sub);
  }

  @Get('continue-watching')
  @ApiOperation(FEED_SWAGGER.getContinueWatching.operation)
  @ApiResponse({ status: 200, description: FEED_SWAGGER.getContinueWatching.responses[200] })
  @ApiResponse({ status: 401, description: FEED_SWAGGER.getContinueWatching.responses[401] })
  getContinueWatching(@CurrentUser() user: JwtPayload) {
    return this.feedService.getContinueWatching(user.sub);
  }
}
