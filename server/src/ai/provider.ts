// Provider-agnostic LLM abstraction (docs/plans/ai-component.md §8).
// Reads the model registry from env (docs/plans/app-idea.md §7.1).
// Currently implements the OpenAI-compatible chat completions protocol, which
// DeepSeek, Azure OpenAI (v1), Ollama, Meta, and xAI all speak. Each model ID
// can map to its own provider (base URL + API key). Swap/extend here without
// touching feature code.

import { getModelConfig, listModelIds, modelRegistry } from '../config/env';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// Normalized chat completion request.
export interface ChatRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  responseFormat?: 'json' | 'json_schema';
}

// Minimal normalized response from a provider.
export interface ChatResponse {
  content: string;
  model: string;
  usage?: { promptTokens?: number; completionTokens?: number; totalTokens?: number };
}

interface OpenAICompatibleResponse {
  choices?: { message?: { content?: string | null } }[];
  model?: string;
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
}

// Null out content after parsing to avoid leaking full payloads in logs.
export async function chat(request: ChatRequest): Promise<ChatResponse> {
  const config = getModelConfig(request.model);
  if (!config || !config.apiKey || !config.baseUrl) {
    throw new Error('AI provider not configured (AI_BASE_URL / AI_API_KEY missing)');
  }

  const body: Record<string, unknown> = {
    model: request.model,
    messages: request.messages,
    temperature: request.temperature ?? 0.7,
  };
  if (request.maxTokens) body.max_tokens = request.maxTokens;
  if (request.responseFormat === 'json') body.response_format = { type: 'json_object' };

  // Fail fast if the provider is slow/unreachable so callers can fall back.
  const timeoutMs = 60_000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let res: Response;
  try {
    res = await fetch(`${config.baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(`AI provider timed out after ${timeoutMs / 1000}s`);
    }
    throw err;
  }
  clearTimeout(timer);

  if (!res.ok) {
    // Read body for a helpful message but never log secrets.
    let detail = `Provider returned ${res.status}`;
    try {
      const errBody = (await res.json()) as { error?: { message?: string } };
      if (errBody?.error?.message) detail += `: ${errBody.error.message}`;
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }

  const data = (await res.json()) as OpenAICompatibleResponse;
  const content = data.choices?.[0]?.message?.content ?? '';
  if (!content) throw new Error('Provider returned an empty response');

  return {
    content,
    model: data.model ?? request.model,
    usage: {
      promptTokens: data.usage?.prompt_tokens,
      completionTokens: data.usage?.completion_tokens,
      totalTokens: data.usage?.total_tokens,
    },
  };
}

export function defaultModel(): string {
  return listModelIds()[0] || modelRegistry[0]?.id || 'deepseek-chat';
}

// Metadata exposed to the UI / drop-down (docs/plans/app-idea.md §7.1).
export interface ModelInfo {
  id: string;
  provider: string;
  label: string;
}

export function modelCatalog(): ModelInfo[] {
  return modelRegistry.map((m) => ({
    id: m.id,
    provider: m.provider,
    label: `${m.provider} · ${m.id}`,
  }));
}
