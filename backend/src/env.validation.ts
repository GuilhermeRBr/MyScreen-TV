import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url('DATABASE_URL deve ser uma URL válida'),
  JWT_SECRET: z
    .string()
    .min(32, 'JWT_SECRET deve ter pelo menos 32 caracteres'),
  JWT_EXPIRATION: z.string().default('15m'),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, 'JWT_REFRESH_SECRET deve ter pelo menos 32 caracteres'),
  JWT_REFRESH_EXPIRATION: z.string().default('7d'),
  FRONTEND_URL: z.string().url('FRONTEND_URL deve ser uma URL válida'),
  TMDB_API_KEY: z.string().min(1, 'TMDB_API_KEY é obrigatório'),
  TMDB_BASE_URL: z
    .string()
    .url()
    .default('https://api.themoviedb.org/3'),
  TMDB_IMAGE_BASE_URL: z
    .string()
    .url()
    .default('https://image.tmdb.org/t/p'),
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z
    .enum(['development', 'staging', 'production', 'test'])
    .default('development'),
  SYSADMIN_EMAIL: z.string().email('SYSADMIN_EMAIL deve ser um e-mail válido'),
  SYSADMIN_PASSWORD: z
    .string()
    .min(8, 'SYSADMIN_PASSWORD deve ter pelo menos 8 caracteres'),
  SYSADMIN_USERNAME: z.string().min(3, 'SYSADMIN_USERNAME deve ter pelo menos 3 caracteres'),
  SYSADMIN_DISPLAY_NAME: z.string().min(1, 'SYSADMIN_DISPLAY_NAME é obrigatório'),
  RESEND_API_KEY: z.string().min(1, 'RESEND_API_KEY é obrigatório'),
  MAIL_FROM: z.string().min(1, 'MAIL_FROM é obrigatório'),

  // Redis / BullMQ
  REDIS_HOST: z.string().min(1, 'REDIS_HOST é obrigatório'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_USERNAME: z.string().optional(),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.coerce.number().default(0),
  REDIS_TLS: z
    .string()
    .optional()
    .transform((val) => val === 'true')
    .pipe(z.boolean().default(false)),
  EMAIL_QUEUE_CONCURRENCY: z.coerce.number().default(5),

  // Bull Board (painel de inspeção de filas — desabilitado por padrão)
  ENABLE_BULL_BOARD: z
    .string()
    .optional()
    .transform((val) => val === 'true')
    .pipe(z.boolean().default(false)),
  BULL_BOARD_USER: z.string().optional(),
  BULL_BOARD_PASSWORD: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    const formatted = result.error.errors
      .map((e) => `  ${e.path.join('.')}: ${e.message}`)
      .join('\n');
    throw new Error(`Variáveis de ambiente inválidas:\n${formatted}`);
  }

  return result.data;
}
