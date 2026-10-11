import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { EmailService } from './email.service';
import { EmailQueueService } from './email.queue.service';
import { EmailProcessor } from './email.processor';
import { QueueModule } from '../queue/queue.module';
import { QUEUE_NAMES } from '../queue/queue.constants';

@Module({
  imports: [
    QueueModule,
    // Necessário para injetar a Queue via @InjectQueue no EmailQueueService
    BullModule.registerQueue({ name: QUEUE_NAMES.EMAIL }),
  ],
  providers: [EmailService, EmailQueueService, EmailProcessor],
  exports: [EmailService, EmailQueueService],
})
export class EmailModule {}
