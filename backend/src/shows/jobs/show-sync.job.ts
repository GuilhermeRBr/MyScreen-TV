/**
 * Tipos dos payloads dos jobs de sincronização de séries.
 *
 * O job de sincronização de temporadas é enfileirado logo após o show ser
 * salvo no banco, desacoplando a espera do usuário da operação pesada de
 * buscar cada temporada/episódio na TMDB.
 */

export const SHOW_SYNC_JOB_NAMES = {
  SYNC_SEASONS: 'sync-seasons',
} as const;

export type ShowSyncJobName =
  (typeof SHOW_SYNC_JOB_NAMES)[keyof typeof SHOW_SYNC_JOB_NAMES];

/**
 * Payload do job de sincronização de temporadas de uma série.
 *
 * seasonNumbers: lista dos números de temporada a sincronizar (season_number > 0).
 */
export interface SyncSeasonsPayload {
  showId: string;
  showTmdbId: number;
  seasonNumbers: number[];
}

export type ShowSyncJobPayload = SyncSeasonsPayload;
