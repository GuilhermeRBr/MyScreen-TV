/**
 * Nomes das filas do BullMQ.
 * Centralizados aqui para evitar strings duplicadas em producers e processors.
 */
export const QUEUE_NAMES = {
  EMAIL: 'email',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];
