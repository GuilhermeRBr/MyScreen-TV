import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ShowsService } from './shows.service';
import { ShowsController } from './shows.controller';
import { TmdbModule } from '../tmdb/tmdb.module';
import { QueueModule } from '../queue/queue.module';
import { QUEUE_NAMES } from '../queue/queue.constants';
import { ShowSyncProcessor } from './show-sync.processor';

const workersEnabled = process.env['ENABLE_WORKERS'] === 'true';

@Module({
  imports: [
    TmdbModule,
    QueueModule,
    BullModule.registerQueue({ name: QUEUE_NAMES.SHOW_SYNC }),
  ],
  controllers: [ShowsController],
  providers: [
    ShowsService,
    ...(workersEnabled ? [ShowSyncProcessor] : []),
  ],
  exports: [ShowsService],
})
export class ShowsModule {}
