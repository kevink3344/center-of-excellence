import path from 'node:path';
import dotenv from 'dotenv';
import { z } from 'zod';

// Load the monorepo-root `.env` regardless of process cwd (dotenv/config reads `./.env`).
// `__dirname` resolves to `<server>/src/config` (dev) or `<server>/dist/config` (build);
// `../../../.env` lands at the repo root from either.
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// Validate required env vars at boot (fail fast). Never log secrets.
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  TURSO_DATABASE_URL: z.string().url(),
  TURSO_AUTH_TOKEN: z.string().min(1),
  JWT_SECRET: z.string().min(1).default('dev-secret-change-me'),
  // Optional AI provider config (from docs/plans/ai-component.md)
  AI_PROVIDER: z.string().optional(),
  AI_BASE_URL: z.string().url().optional(),
  AI_MODEL: z.string().optional(),
  AI_API_KEY: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('❌ Invalid environment configuration:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
