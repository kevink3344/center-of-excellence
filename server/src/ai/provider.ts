// Provider-agnostic LLM abstraction (docs/plans/ai-component.md §8).
// Reads `AI_PROVIDER`/`AI_BASE_URL`/`AI_MODEL`/`AI_API_KEY` from env.
// Currently implements the OpenAI-compatible chat completions protocol, which
// DeepSeek, Azure OpenAI (v1), and Ollama all speak. Swap/extend here without
// touching feature code.

import { env } from '../config/env';

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
  if (!env.AI_API_KEY || !env.AI_BASE_URL) {
    throw new Error('AI provider not configured (AI_BASE_URL / AI_API_KEY missing)');
  }

  const body: Record<string, unknown> = {
    model: request.model,
    messages: request.messages,
    temperature: request.temperature ?? 0.7,
  };
  if (request.maxTokens) body.max_tokens = request.maxTokens;
  if (request.responseFormat === 'json') body.response_format = { type: 'json_object' };

  const res = await fetch(`${env.AI_BASE_URL.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.AI_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

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
  return env.AI_MODEL || 'deepseek-chat';
}
