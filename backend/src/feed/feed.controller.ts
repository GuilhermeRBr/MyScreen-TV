import { Controller, Get, UseGuards } from '@nestjs/common';
import { FeedService } from './feed.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@Controller('feed')
@UseGuards(JwtAuthGuard)
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  @Get('discover')
  getDiscover() {
    return this.feedService.getDiscover();
  }

  @Get('upcoming')
  getUpcoming(@CurrentUser() user: JwtPayload) {
    return this.feedService.getUpcoming(user.sub);
  }

  @Get('continue-watching')
  getContinueWatching(@CurrentUser() user: JwtPayload) {
    return this.feedService.getContinueWatching(user.sub);
  }
}
