import path from 'node:path';
import dotenv from 'dotenv';
import { z } from 'zod';

// Load the monorepo-root `.env` regardless of process cwd (dotenv/config reads `./.env`).
// `__dirname` resolves to `<server>/src/config` (dev) or `<server>/dist/config` (build);
// `../../../.env` lands at the repo root from either.
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// ─────────────────────────────────────────────────────────────
// AI model registry.
//
// A project may expose several AI models, each backed by its own
// OpenAI-compatible provider. The *primary* provider uses the
// unsuffixed `AI_PROVIDER` / `AI_BASE_URL` / `AI_MODEL` / `AI_API_KEY`.
// Additional providers use the suffixed forms `AI_PROVIDER2/3/...`,
// `AI_BASE_URL2/3/...`, `AI_MODEL2/3/...`, `AI_API_KEY2/3/...`.
// `AI_MODELS` is a comma-separated list of model IDs exposed in the
// UI drop-down (docs/plans/app-idea.md §7.1).
// ─────────────────────────────────────────────────────────────
const OPTIONAL_AI = {
  AI_PROVIDER: z.string().optional(),
  AI_BASE_URL: z.string().url().optional(),
  AI_MODEL: z.string().optional(),
  AI_API_KEY: z.string().optional(),
  AI_PROVIDER2: z.string().optional(),
  AI_BASE_URL2: z.string().url().optional(),
  AI_MODEL2: z.string().optional(),
  AI_API_KEY2: z.string().optional(),
  AI_PROVIDER3: z.string().optional(),
  AI_BASE_URL3: z.string().url().optional(),
  AI_MODEL3: z.string().optional(),
  AI_API_KEY3: z.string().optional(),
  AI_PROVIDER4: z.string().optional(),
  AI_BASE_URL4: z.string().url().optional(),
  AI_MODEL4: z.string().optional(),
  AI_API_KEY4: z.string().optional(),
  AI_MODELS: z.string().optional(),
};

// Validate required env vars at boot (fail fast). Never log secrets.
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  TURSO_DATABASE_URL: z.string().url(),
  TURSO_AUTH_TOKEN: z.string().min(1),
  JWT_SECRET: z.string().min(1).default('dev-secret-change-me'),
  // Optional AI provider config (from docs/plans/ai-component.md + app-idea.md §7.1)
  ...OPTIONAL_AI,
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('❌ Invalid environment configuration:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

// ─────────────────────────────────────────────────────────────
// Build the model registry from env. Each entry is keyed by model ID
// and carries its own base URL + API key so `chat()` can route to the
// correct provider. Falls back safely when nothing is configured.
// ─────────────────────────────────────────────────────────────
export interface ModelConfig {
  id: string;
  provider: string;
  baseUrl: string;
  apiKey: string;
  model: string;
}

function collectModelConfigs(): ModelConfig[] {
  // Primary provider (unsuffixed) always participates first.
  const primary: ModelConfig | null =
    env.AI_MODEL && env.AI_BASE_URL
      ? {
          id: env.AI_MODEL,
          provider: env.AI_PROVIDER || 'openai',
          baseUrl: env.AI_BASE_URL,
          apiKey: env.AI_API_KEY || '',
          model: env.AI_MODEL,
        }
      : null;

  const extra: ModelConfig[] = [];
  for (let i = 2; i <= 4; i++) {
    const model = (env as any)[`AI_MODEL${i}`];
    const baseUrl = (env as any)[`AI_BASE_URL${i}`];
    if (!model || !baseUrl) continue;
    extra.push({
      id: model,
      provider: (env as any)[`AI_PROVIDER${i}`] || 'openai',
      baseUrl,
      apiKey: (env as any)[`AI_API_KEY${i}`] || '',
      model,
    });
  }

  const all = [...(primary ? [primary] : [])];
  // Dedupe by id, keep first occurrence (primary wins).
  const seen = new Set(all.map((m) => m.id));
  for (const m of extra) {
    if (!seen.has(m.id)) {
      all.push(m);
      seen.add(m.id);
    }
  }
  return all;
}

export const modelRegistry: ModelConfig[] = collectModelConfigs();

// The `AI_MODELS` comma-separated list, if provided, determines the UI
// order/filter. Defaults to the registry order when absent.
export function listModelIds(): string[] {
  const configured: string[] = (env.AI_MODELS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (configured.length) {
    // Preserve registry config for any model in the list; ignore unknowns.
    return modelRegistry.filter((m) => configured.includes(m.id)).map((m) => m.id);
  }
  return modelRegistry.map((m) => m.id);
}

export function getModelConfig(modelId: string): ModelConfig | undefined {
  return modelRegistry.find((m) => m.id === modelId) ?? modelRegistry[0];
}
