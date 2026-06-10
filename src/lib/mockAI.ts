import { Message, ImageGenRequest, VideoGenRequest, VideoTask } from '@/types/chat';
import { supabase } from '@/lib/supabase';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { PersonalityPreset } from '@/components/features/PersonalityPicker';
import { searchKnowledge, formatKnowledgeContext } from '@/lib/knowledgeSearch';

const PRIMARY_AI_FUNCTION_NAME =
  (import.meta.env.VITE_MOCKJ_AI_FUNCTION_NAME as string | undefined) || 'mocka-chat-v2';
const FALLBACK_AI_FUNCTION_NAME =
  PRIMARY_AI_FUNCTION_NAME === 'mocka-chat-v2' ? 'mocka-chat' : undefined;

type AiFunctionBody = Record<string, unknown>;

function shouldFallbackToV1(status?: number) {
  return status === 404 || status === 410;
}

async function readFunctionError(error: unknown): Promise<Error> {
  if (error instanceof FunctionsHttpError) {
    try {
      const statusCode = error.context?.status ?? 500;
      const textContent = await error.context?.text();
      let message = textContent || error.message || 'Unknown error';
      let limitExceeded = false;

      try {
        const parsed = JSON.parse(textContent || '{}') as { error?: string; limitExceeded?: boolean };
        message = parsed.error || message;
        limitExceeded = parsed.limitExceeded === true;
      } catch {
        // Keep raw text for non-JSON function errors.
      }

      const fnError = new Error(`[Code: ${statusCode}] ${message}`) as Error & {
        limitExceeded?: boolean;
        status?: number;
      };
      fnError.limitExceeded = limitExceeded;
      fnError.status = statusCode;
      return fnError;
    } catch {
      return new Error(error.message || 'Failed to read response');
    }
  }

  return new Error(error instanceof Error ? error.message : 'Function request failed');
}

async function invokeAiFunction<T>(body: AiFunctionBody): Promise<T> {
  const primary = await supabase.functions.invoke(PRIMARY_AI_FUNCTION_NAME, { body });
  if (!primary.error) return primary.data as T;

  const status = primary.error instanceof FunctionsHttpError ? primary.error.context?.status : undefined;
  if (FALLBACK_AI_FUNCTION_NAME && shouldFallbackToV1(status)) {
    console.warn(`MockJ AI function ${PRIMARY_AI_FUNCTION_NAME} missing; falling back to ${FALLBACK_AI_FUNCTION_NAME}.`);
    const fallback = await supabase.functions.invoke(FALLBACK_AI_FUNCTION_NAME, { body });
    if (!fallback.error) return fallback.data as T;
    throw await readFunctionError(fallback.error);
  }

  throw await readFunctionError(primary.error);
}

async function fetchAiFunction(body: AiFunctionBody): Promise<Response> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

  const request = (functionName: string) => fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${supabaseKey}`,
      apikey: supabaseKey,
    },
    body: JSON.stringify(body),
  });

  const primary = await request(PRIMARY_AI_FUNCTION_NAME);
  if (FALLBACK_AI_FUNCTION_NAME && shouldFallbackToV1(primary.status)) {
    console.warn(`MockJ AI function ${PRIMARY_AI_FUNCTION_NAME} missing; falling back to ${FALLBACK_AI_FUNCTION_NAME}.`);
    return request(FALLBACK_AI_FUNCTION_NAME);
  }

  return primary;
}

// ──────────────────────────────────────────────────────────────────────────────
// Chat history type
// ──────────────────────────────────────────────────────────────────────────────

export interface ChatHistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

// ──────────────────────────────────────────────────────────────────────────────
// Streaming chat via OnSpace AI Edge Function
// Returns an async generator that yields text chunks
// ──────────────────────────────────────────────────────────────────────────────

export async function* streamChatResponse(
  message: string,
  history: ChatHistoryMessage[] = [],
  deepReasoning = false,
  personality: PersonalityPreset = 'chill-bro'
): AsyncGenerator<string> {
  // Inject project knowledge context when relevant
  const knowledgeResults = searchKnowledge(message, 3, 4);
  const knowledgeContext = formatKnowledgeContext(knowledgeResults);
  const userContent = deepReasoning
    ? `${message}\n\n[DEEP REASONING MODE] Before giving your answer, work through this step by step. Wrap your reasoning process in <reasoning> tags with numbered steps, then provide your final answer after the closing </reasoning> tag. Format:\n<reasoning>\n1. [First step]\n2. [Next step]\n...\n</reasoning>\n[Final answer here]`
    : message;

  const messages: ChatHistoryMessage[] = [
    ...history.map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: userContent },
  ];

  const response = await fetchAiFunction({ type: 'chat', messages, stream: true, personalityPreset: personality, knowledgeContext });

  if (!response.ok || !response.body) {
    const text = await response.text();
    // Surface rate-limit errors clearly so the UI can show the paywall
    if (response.status === 429) {
      let msg = 'Daily limit reached. Upgrade to MockJ Pro for unlimited access.';
      try { const d = JSON.parse(text); if (d.error) msg = d.error; } catch { /* ignore */ }
      const err = new Error(msg) as Error & { limitExceeded: boolean; status: number };
      err.limitExceeded = true;
      err.status = 429;
      throw err;
    }
    throw new Error(text || `Request failed: ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data: ')) continue;
      const data = trimmed.slice(6);
      if (data === '[DONE]') return;
      try {
        const parsed = JSON.parse(data);
        const chunk: string = parsed.choices?.[0]?.delta?.content ?? '';
        if (chunk) yield chunk;
      } catch {
        // skip malformed SSE lines
      }
    }
  }
}

// Fallback non-streaming for compatibility
export async function generateChatResponse(
  message: string,
  history: ChatHistoryMessage[] = []
): Promise<string> {
  const messages: ChatHistoryMessage[] = [
    ...history.map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: message },
  ];

  const data = await invokeAiFunction<{ content?: string }>({ type: 'chat', messages, stream: false });

  return data?.content ?? "An unexpected interruption occurred. Please resubmit your query.";
}

// ──────────────────────────────────────────────────────────────────────────────
// Image generation / editing via OnSpace AI
// ──────────────────────────────────────────────────────────────────────────────

export async function generateImage(request: ImageGenRequest): Promise<string> {
  const data = await invokeAiFunction<{ imageUrl?: string }>({
    type: 'image',
    prompt: request.prompt,
    style: request.style,
    aspectRatio: request.aspectRatio,
    quality: request.quality ?? '1K',
    modelVersion: request.modelVersion,
    sourceImageDataUrl: request.sourceImageDataUrl,
    charConsistency: request.charConsistency,
    facePreservation: request.facePreservation,
    addWatermark: request.addWatermark,
    privateMode: request.privateMode,
  });

  const imageUrl = data?.imageUrl;
  if (!imageUrl) throw new Error('No image URL returned');
  return imageUrl;
}

// ──────────────────────────────────────────────────────────────────────────────
// Video generation — async task-based via OnSpace AI (Sora-2)
// ──────────────────────────────────────────────────────────────────────────────

// Map UI duration string to seconds number
function durationToSeconds(d: string): number {
  const n = parseInt(d, 10);
  return [4, 8, 12].includes(n) ? n : 8;
}

// Map UI aspect ratio to Sora aspect_ratio param
function mapAspectRatio(ratio: string): string {
  if (ratio === '9:16') return 'portrait';
  if (ratio === '1:1') return 'square';
  return 'landscape';
}

export async function createVideoTask(request: VideoGenRequest): Promise<VideoTask> {
  const data = await invokeAiFunction<{ id: string; status?: VideoTask['status'] }>({
    type: 'video-create',
    prompt: request.prompt,
    style: request.style,
    duration: durationToSeconds(request.duration),
    aspectRatio: mapAspectRatio(request.aspectRatio ?? '16:9'),
  });

  return {
    id: data.id,
    status: data.status ?? 'starting',
    progress: 0,
  };
}

export async function checkVideoTask(predictionId: string): Promise<VideoTask> {
  const data = await invokeAiFunction<{
    status: VideoTask['status'];
    progress?: number;
    videoUrl?: string;
    error?: string;
  }>({ type: 'video-check', predictionId });

  return {
    id: predictionId,
    status: data.status,
    progress: data.progress ?? 0,
    videoUrl: data.videoUrl,
    error: data.error,
  };
}

// Legacy placeholder for inline video chat mode (still used in chat)
export async function generateVideo(_request: VideoGenRequest): Promise<{ thumbnailUrl: string; label: string; duration: string }> {
  await delay(1500);
  const seed = Math.floor(Math.random() * 10000);
  return {
    thumbnailUrl: `https://picsum.photos/seed/${seed}/1280/720`,
    label: 'Video (Studio)',
    duration: _request.duration,
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function buildMessage(
  role: 'user' | 'assistant',
  content: string,
  type: Message['type'] = 'text',
  mediaUrl?: string,
  mediaPrompt?: string,
  streaming = false
): Message {
  return {
    id: crypto.randomUUID(),
    role,
    content,
    type,
    mediaUrl,
    mediaPrompt,
    timestamp: new Date(),
    streaming,
  };
}
