import { Module } from '@nestjs/common';
import { TmdbClient } from './tmdb.client';
import { TmdbService } from './tmdb.service';

@Module({
  providers: [TmdbClient, TmdbService],
  exports: [TmdbService],
})
export class TmdbModule {}
