import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { BullBoardModule } from '@bull-board/nestjs';
import { ExpressAdapter } from '@bull-board/express';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { validateEnv } from './env.validation';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ShowsModule } from './shows/shows.module';
import { MoviesModule } from './movies/movies.module';
import { WatchModule } from './watch/watch.module';
import { ListsModule } from './lists/lists.module';
import { FeedModule } from './feed/feed.module';
import { TmdbModule } from './tmdb/tmdb.module';
import { QueueModule } from './queue/queue.module';
import { QUEUE_NAMES } from './queue/queue.constants';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minuto
        limit: 100, // 100 requests por IP por minuto
      },
    ]),
    PrismaModule,
    QueueModule,
    // Bull Board — painel de inspeção de filas.
    // A rota /queues é protegida por autenticação básica em main.ts.
    // O painel é registrado sempre, mas só exposto quando ENABLE_BULL_BOARD=true.
    BullBoardModule.forRoot({
      route: '/queues',
      adapter: ExpressAdapter,
    }),
    BullBoardModule.forFeature({
      name: QUEUE_NAMES.EMAIL,
      // @ts-expect-error: @bull-board/api@6 declara peerDep bullmq@^4, mas é compatível
      // em runtime com bullmq@5. O erro é de tipos apenas — nenhum comportamento é afetado.
      adapter: BullMQAdapter,
    }),
    AuthModule,
    UsersModule,
    ShowsModule,
    MoviesModule,
    WatchModule,
    ListsModule,
    FeedModule,
    TmdbModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
