import { GenerateStoryInput, generateStorySchema } from '@eidh/shared';
import { generateStoryDraft } from '../ai/stories';
import { ApiError } from '../middleware/error';

// POST /api/v1/ai/story — generate a user-story draft from a prompt.
// Degrades gracefully: if the AI provider is unavailable/unconfigured we return
// 503 AI_UNAVAILABLE so the client can fall back to its deterministic generator.
export async function generateStory(req: any, res: any) {
  const body = req.validated?.body as GenerateStoryInput;

  try {
    const draft = await generateStoryDraft(body.prompt);
    res.json({ data: draft });
  } catch (err) {
    // Provider misconfiguration / outage → tell the client to fall back.
    const message = err instanceof Error ? err.message : 'Story generation failed';
    throw new ApiError(503, 'AI_UNAVAILABLE', message || 'AI service unavailable');
  }
}
