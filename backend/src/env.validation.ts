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
