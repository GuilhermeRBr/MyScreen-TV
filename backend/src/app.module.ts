import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
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
    AuthModule,
    UsersModule,
    ShowsModule,
    MoviesModule,
    WatchModule,
    ListsModule,
    FeedModule,
    TmdbModule,
  ],
})
export class AppModule {}
