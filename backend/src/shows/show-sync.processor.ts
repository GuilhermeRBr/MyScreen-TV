import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QUEUE_NAMES } from '../queue/queue.constants';
import {
  SHOW_SYNC_JOB_NAMES,
  ShowSyncJobPayload,
  SyncSeasonsPayload,
} from './jobs/show-sync.job';
import { TmdbService } from '../tmdb/tmdb.service';
import { SHOW_SYNC_MESSAGES } from './messages/show-sync.messages';

/**
 * Worker que sincroniza temporadas e episódios de uma série em background.
 *
 * Concorrência:
 * - Limitada a 2 jobs simultâneos para não sobrecarregar a API da TMDB
 *   com chamadas em paralelo vindas de múltiplas séries ao mesmo tempo.
 * - Cada job percorre as temporadas sequencialmente (proteção contra race
 *   condition nos unique constraints de season e episode).
 *
 * Retentativas:
 * - 3 tentativas com backoff exponencial: 10 s, 20 s, 40 s (configurado em QueueModule).
 *
 * Idempotência:
 * - upsertSeason verifica lastSyncedAt antes de chamar a TMDB.
 *   Reprocessar o mesmo job é seguro — apenas temporadas com cache frio
 *   serão sincronizadas novamente.
 */
@Processor(QUEUE_NAMES.SHOW_SYNC, { concurrency: 2 })
export class ShowSyncProcessor extends WorkerHost {
  private readonly logger = new Logger(ShowSyncProcessor.name);

  constructor(private readonly tmdbService: TmdbService) {
    super();
  }

  async process(job: Job<ShowSyncJobPayload>): Promise<void> {
    this.logger.log(
      `${SHOW_SYNC_MESSAGES.JOB_STARTED} | jobId=${job.id} | name=${job.name} | tentativa=${job.attemptsMade + 1}`,
    );

    const startedAt = Date.now();

    switch (job.name) {
      case SHOW_SYNC_JOB_NAMES.SYNC_SEASONS:
        await this.processSyncSeasons(job as Job<SyncSeasonsPayload>);
        break;

      default:
        this.logger.error(
          `${SHOW_SYNC_MESSAGES.UNKNOWN_JOB_TYPE} | jobId=${job.id} | name=${job.name}`,
        );
        throw new Error(`${SHOW_SYNC_MESSAGES.UNKNOWN_JOB_TYPE}: ${job.name}`);
    }

    const duration = Date.now() - startedAt;
    this.logger.log(
      `${SHOW_SYNC_MESSAGES.JOB_COMPLETED} | jobId=${job.id} | name=${job.name} | duracao=${duration}ms`,
    );
  }

  private async processSyncSeasons(
    job: Job<SyncSeasonsPayload>,
  ): Promise<void> {
    const { showId, showTmdbId, seasonNumbers } = job.data;

    for (const seasonNumber of seasonNumbers) {
      await this.tmdbService.upsertSeason(showId, showTmdbId, seasonNumber);
    }
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<ShowSyncJobPayload>, error: Error): void {
    const isFinalAttempt = job.attemptsMade >= (job.opts.attempts ?? 1);

    this.logger.error(
      `${SHOW_SYNC_MESSAGES.JOB_FAILED} | jobId=${job.id} | name=${job.name}` +
        ` | tentativa=${job.attemptsMade}/${job.opts.attempts ?? 1}` +
        ` | definitivo=${isFinalAttempt}` +
        ` | erro=${error.message}`,
    );
  }

  @OnWorkerEvent('stalled')
  onStalled(jobId: string): void {
    this.logger.warn(`${SHOW_SYNC_MESSAGES.JOB_STALLED} | jobId=${jobId}`);
  }
}
