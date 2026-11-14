-- Reseta o cache de sincronização de séries e filmes.
-- Necessário sempre que a lógica de sync do TmdbService for alterada,
-- para garantir que todos os registros existentes sejam re-sincronizados
-- com os dados corretos na próxima visita.
UPDATE shows SET "lastSyncedAt" = '2000-01-01';
UPDATE movies SET "lastSyncedAt" = '2000-01-01';
