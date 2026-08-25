// AI enrichment for the Application Idea Generator (docs/plans/app-idea.md §7).
// Mirrors the structure of `stories.ts`: builds a bounded prompt, calls the
// provider with the *selected* model, and Zod-validates the structured JSON
// output into an AppDesign. Returns null on provider/unavailable failure so the
// caller can degrade gracefully to the deterministic engine.

import { appDesignSchema, type AppDesign, type AppIdeaAnswers, type GeneratorSettings } from '@eidh/shared';
import { chat } from './provider';

// Builds the system prompt for a given idea + answers. Instructs exact JSON
// shape (no markdown fences) and enforces the AppDesign keys/enum values.
function buildPrompt(
  ideaText: string,
  answers: AppIdeaAnswers,
  settings: GeneratorSettings,
): string {
  const authLine =
    settings.authMode === 'sso'
      ? 'SSO (M365/Entra) as the primary login, with optional local credentials.'
      : settings.authMode === 'jwt_sso'
        ? 'JWT-based auth with an option for federated SSO (M365/Entra).'
        : 'JWT-based auth (JSON Web Tokens) with optional SSO integration.';
  const dbLine =
    settings.defaultDatabase === settings.productionDatabase
      ? `${settings.defaultDatabase}`
      : `${settings.defaultDatabase} (development) → ${settings.productionDatabase} (production)`;

  return `You are an expert solution architect and product owner at an enterprise Center of Excellence.
A person wants to build a software application. Produce a complete application design as STRICT JSON
(no markdown fences, no commentary, no trailing prose) with EXACTLY these keys:

- "name": a concise product name (title case, max ~60 chars)
- "headline": a one-line value proposition
- "summary": 2-3 sentences describing what the app does and for whom
- "architecture": describe the architecture pattern (monolith / modular monolith / microservices) and why
- "stack": array of 4-8 technologies (language, framework, data store, hosting)
- "dataModel": { "coreEntities": string[], "relationships": string[] }
- "integrations": array of { "name": string, "purpose": string } (empty if no connectivity)
- "security": { "authentication": string, "authorization": string, "dataProtection": string }
- "estimate": { "effort": "XS"|"S"|"M"|"L"|"XL", "tShirt": string, "weeks": number, "team": string[] }
- "phases": array of { "name": string, "weeks": number, "focus": string } (2-4 phases)
- "risks": array of { "risk": string, "mitigation": string } (2-4 risks)
- "readyStories": array (3-5) of { "title": string, "story": string, "acceptance": string[] } — user stories
- "reasoning": 1-2 sentences justifying the architecture/stack decisions

=== DEFAULT TECHNOLOGY STACK (prefer these) ===
${settings.techStack.join(', ')}

=== DEFAULT AUTHENTICATION ===
${authLine}

=== DEFAULT DATABASE ===
${dbLine}

=== SCALE (number of users): ${answers.userClass} ===
Auth/hosting/scaling must suit this scale.

=== SIZE: ${answers.appSize} ===
${answers.appSize === 'small' ? 'Single-page app + single API monolith, small team (1-2 devs), 4-8 weeks, effort S.' : answers.appSize === 'medium' ? 'Modular monolith + API with split modules, 2-4 devs, 8-16 weeks, effort M.' : 'Service-oriented / microservices with event bus, 4-8+ cross-functional devs, 16-32+ weeks, effort L-XL.'}

=== AUDIENCE: ${answers.audience} ===
${answers.audience === 'internal' ? 'M365/Entra SSO (federated), role-based per-BU, least-privilege, internal policy.' : 'External IdP + MFA, self-registration, scoped per-tenant/customer consent, privacy + DPA + WCAG accessibility + data residency.'}

=== INTEGRATIONS: ${answers.connectivity ? 'YES' : 'NO'} ===
${answers.connectivity ? '1-3 integrations via REST + async queue / event-driven. Describe source systems, sync cadence, error handling.' : 'No integrations. Standalone; data lives inside the app.'}

=== RAW IDEA ===
${ideaText}

Respond ONLY with the JSON object.`;
}

function parseJsonObject(raw: string): Record<string, unknown> | null {
  let text = raw.trim();
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
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

// Generates an AppDesign for the given idea + answers using the selected model.
// Throws when the provider is unavailable / returns unparseable output so the
// controller can fall back to the deterministic engine.
export async function generateIdeaDesign(
  ideaText: string,
  answers: AppIdeaAnswers,
  model: string,
  settings: GeneratorSettings,
): Promise<AppDesign> {
  const response = await chat({
    model,
    responseFormat: 'json',
    messages: [
      { role: 'system', content: buildPrompt(ideaText, answers, settings) },
      { role: 'user', content: `Idea: ${ideaText}` },
    ],
    temperature: 0.7,
    maxTokens: 4000,
  });

  const parsed = parseJsonObject(response.content);
  if (!parsed) {
    throw new Error('AI returned unparseable output');
  }

  // LLMs often emit floats (e.g. `weeks: 2.0`) which fail the integer schema.
  // Coerce numeric week fields to integers before validating.
  const normalized = normalizeNumericFields(parsed);

  // Validate the shape; throws ZodError on mismatch (surfaced as AI_UNAVAILABLE).
  return appDesignSchema.parse(normalized);
}

// Round float week/effort numbers to integers (schema expects z.number().int()).
function normalizeNumericFields(input: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...input };
  const toInt = (v: unknown): unknown => (typeof v === 'number' ? Math.round(v) : v);

  if (out.estimate && typeof out.estimate === 'object') {
    out.estimate = { ...(out.estimate as Record<string, unknown>), weeks: toInt((out.estimate as any).weeks) };
  }
  if (Array.isArray(out.phases)) {
    out.phases = out.phases.map((p) =>
      p && typeof p === 'object'
        ? { ...(p as Record<string, unknown>), weeks: toInt((p as any).weeks) }
        : p,
    );
  }
  return out;
}
