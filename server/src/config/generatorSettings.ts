// Server-side helper for admin-configurable Application Idea Generator defaults.
// Reads/writes the `generator_settings` key in the `app_settings` KV store and
// falls back to the shared DEFAULT_GENERATOR_SETTINGS when unset/invalid.
//
// The resolved settings are consumed by:
//   - `ai/ideas.ts`  → injected into the AI prompt (tech stack, auth, DB)
//   - the deterministic client engine via the GET /settings endpoint

import { eq } from 'drizzle-orm';
import { db } from '../db';
import { appSettings } from '../db/schema';
import {
  generatorSettingsSchema,
  DEFAULT_GENERATOR_SETTINGS,
  type GeneratorSettings,
} from '@eidh/shared';

export const GENERATOR_SETTINGS_KEY = 'generator_settings';

// Parse a stored JSON value into validated GeneratorSettings, or defaults.
export function parseSettings(raw: string | null | undefined): GeneratorSettings {
  if (!raw) return { ...DEFAULT_GENERATOR_SETTINGS };
  try {
    return generatorSettingsSchema.parse(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_GENERATOR_SETTINGS };
  }
}

// Read the stored generator settings (always a valid GeneratorSettings).
export async function getGeneratorSettings(): Promise<GeneratorSettings> {
  const row = await db.query.appSettings.findFirst({
    where: eq(appSettings.key, GENERATOR_SETTINGS_KEY),
  });
  return parseSettings(row?.value);
}

// Persist generator settings (upsert). Returns the saved settings.
export async function saveGeneratorSettings(input: GeneratorSettings): Promise<GeneratorSettings> {
  const parsed = generatorSettingsSchema.parse(input);
  const value = JSON.stringify(parsed);
  await db
    .insert(appSettings)
    .values({ key: GENERATOR_SETTINGS_KEY, value })
    .onConflictDoUpdate({
      target: appSettings.key,
      set: { value, updatedAt: new Date().toISOString() },
    });
  return parsed;
}
