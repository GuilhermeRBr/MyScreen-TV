-- Adiciona contador de reassistidos ao MovieWatch.
ALTER TABLE "movie_watches" ADD COLUMN "rewatchCount" INTEGER NOT NULL DEFAULT 0;
