import { defaultModel, modelCatalog } from '../ai/provider';

// GET /api/v1/ai/models — expose the selectable AI model drop-down.
export async function getModels(req: any, res: any) {
  const models = modelCatalog();
  res.json({ data: { models, default: defaultModel() } });
}
