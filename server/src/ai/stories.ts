// Module B — Requirements & Story Generator (docs/plans/ai-component.md §4).
// Builds a bounded prompt, calls the provider, and Zod-validates the structured
// JSON output into a StoryDraft. Returns null on provider/unavailable failure so
// the caller can degrade gracefully (per the plan's "deterministic fallback").

import { StoryDraft, storyDraftSchema } from '@eidh/shared';
import { chat, defaultModel } from './provider';

// System prompt instructs exact JSON shape (no markdown fences).
const SYSTEM_PROMPT = `You are an expert product owner writing user stories for an enterprise CoE/ALM portal.
Given a plain-English description, produce a single user story as strict JSON (no markdown fences, no commentary) with exactly these keys:
- "title": a concise, human title (max ~70 chars)
- "story": a single sentence in the form "As a <role>, I want <goal> so that I can <benefit>."
- "acceptance": an array of 3-5 Given/When/Then acceptance criteria strings
- "reasoning": 1-2 sentences explaining the domain/effort assumptions behind the draft

Respond ONLY with the JSON object.`;

function parseJsonObject(raw: string): Record<string, unknown> | null {
  // Strip any accidental code fences and surrounding whitespace.
  let text = raw.trim();
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    // Try to find the first '{' ... last '}' in case of extra prose.
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      try {
        return JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>;
      } catch {
        return null;
      }
    }
    return null;
  }
}

export async function generateStoryDraft(prompt: string): Promise<StoryDraft> {
  const response = await chat({
    model: defaultModel(),
    responseFormat: 'json',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `Description: ${prompt}` },
    ],
    temperature: 0.7,
    maxTokens: 2000,
  });

  const parsed = parseJsonObject(response.content);
  if (!parsed) {
    throw new Error('AI returned unparseable output');
  }

  // Validate the shape; throws ZodError on mismatch (surfaced as 500-friendly).
  return storyDraftSchema.parse(parsed);
}
