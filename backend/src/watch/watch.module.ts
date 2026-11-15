import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { WatchService } from './watch.service';
import { WatchController } from './watch.controller';
import { TmdbModule } from '../tmdb/tmdb.module';
import { QueueModule } from '../queue/queue.module';
import { QUEUE_NAMES } from '../queue/queue.constants';

@Module({
  imports: [
    TmdbModule,
    QueueModule,
    BullModule.registerQueue({ name: QUEUE_NAMES.SHOW_SYNC }),
  ],
  controllers: [WatchController],
  providers: [WatchService],
  exports: [WatchService],
})
export class WatchModule {}
