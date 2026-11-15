-- Adiciona contador de reassistidos ao WatchProgress.
-- Episódios reassistidos incrementam este campo em vez de criar novos registros.
ALTER TABLE "watch_progresses" ADD COLUMN "rewatchCount" INTEGER NOT NULL DEFAULT 0;
