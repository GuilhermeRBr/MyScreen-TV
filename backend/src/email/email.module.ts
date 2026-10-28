import { Module, Logger } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { EmailService } from './email.service';
import { EmailQueueService } from './email.queue.service';
import { EmailProcessor } from './email.processor';
import { QueueModule } from '../queue/queue.module';
import { QUEUE_NAMES } from '../queue/queue.constants';

const workersEnabled = process.env['ENABLE_WORKERS'] === 'true';

if (!workersEnabled) {
  new Logger('EmailModule').warn(
    'Workers desativados (ENABLE_WORKERS != true). O worker de e-mail não será iniciado.',
  );
}

@Module({
  imports: [
    QueueModule,
    // Necessário para injetar a Queue via @InjectQueue no EmailQueueService
    BullModule.registerQueue({ name: QUEUE_NAMES.EMAIL }),
  ],
  providers: [
    EmailService,
    EmailQueueService,
    // O worker só é registrado como provider quando ENABLE_WORKERS=true,
    // evitando conexões desnecessárias ao Redis em desenvolvimento.
    ...(workersEnabled ? [EmailProcessor] : []),
  ],
  exports: [EmailService, EmailQueueService],
})
export class EmailModule {}
