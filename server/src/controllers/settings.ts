// App settings API — admin-configurable defaults for the Application Idea
// Generator (tech stack, auth mode, default/dev + production databases).
import { getGeneratorSettings, saveGeneratorSettings } from '../config/generatorSettings';
import {
  generatorSettingsSchema,
  type GeneratorSettings,
  type GeneratorSettingsInput,
} from '@eidh/shared';

// GET /api/v1/settings/generator — read current generator settings.
export async function getGeneratorSettingsHandler(_req: any, res: any) {
  const settings = await getGeneratorSettings();
  res.json({ data: settings });
}

// PUT /api/v1/settings/generator — persist generator settings.
export async function updateGeneratorSettingsHandler(req: any, res: any) {
  const body = req.validated?.body as GeneratorSettingsInput;
  const settings: GeneratorSettings = generatorSettingsSchema.parse(body);
  const saved = await saveGeneratorSettings(settings);
  res.json({ data: saved });
}

// GET /api/v1/settings — list all settings keys (admin visibility).
export async function listSettingsHandler(_req: any, res: any) {
  const settings = await getGeneratorSettings();
  res.json({ data: { generator: settings } });
}
