import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

type ActionType = 'chat' | 'image' | 'video';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatRequestBody {
  type: 'chat';
  messages: ChatMessage[];
  stream?: boolean;
  personalityPreset?: string;
  knowledgeContext?: string;
}

interface ImageRequestBody {
  type: 'image';
  prompt: string;
  style?: string;
  aspectRatio?: string;
  quality?: string;
  modelVersion?: string;
  sourceImageDataUrl?: string;
  charConsistency?: boolean;
  facePreservation?: boolean;
  addWatermark?: boolean;
  privateMode?: boolean;
}

interface VideoCreateBody {
  type: 'video-create';
  prompt: string;
  style?: string;
  duration?: number;
  aspectRatio?: string;
}

interface VideoCheckBody {
  type: 'video-check';
  predictionId: string;
}

type RequestBody = ChatRequestBody | ImageRequestBody | VideoCreateBody | VideoCheckBody;

const FREE_LIMITS: Record<ActionType, number> = { chat: 10, image: 10, video: 1 };
const MAX_ATTEMPTS = 3;
const REQUEST_TIMEOUT_MS = 60_000;
const RETRY_STATUSES = new Set([429, 503, 504]);
const DEFAULT_IMAGE_MODEL = 'google/gemini-2.5-flash-image';
const CHAT_MODEL = 'google/gemini-3-flash-preview';

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function errorResponse(status: number, code: string, message: string, extra: Record<string, unknown> = {}) {
  return jsonResponse({ ok: false, error: message, code, ...extra }, status);
}

function sanitizeErrorText(text: string) {
  return text
    .replace(/sk_(live|test)_[A-Za-z0-9_]+/g, '[redacted_stripe_key]')
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [redacted]')
    .replace(/eyJ[A-Za-z0-9._-]+/g, '[redacted_jwt]')
    .slice(0, 700);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url: string, init: RequestInit, label: string): Promise<Response> {
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url, { ...init, signal: controller.signal });
      clearTimeout(timeout);

      if (!RETRY_STATUSES.has(response.status) || attempt === MAX_ATTEMPTS) {
        return response;
      }

      const retryText = sanitizeErrorText(await response.text().catch(() => ''));
      console.warn(`mocka-chat-v2: ${label} retry ${attempt}/${MAX_ATTEMPTS}, status=${response.status}, body=${retryText}`);
    } catch (error) {
      clearTimeout(timeout);
      lastError = error;
      if (attempt === MAX_ATTEMPTS) break;
      console.warn(`mocka-chat-v2: ${label} network retry ${attempt}/${MAX_ATTEMPTS}`, error);
    }

    await sleep(500 * 2 ** (attempt - 1));
  }

  throw lastError instanceof Error ? lastError : new Error(`${label} failed after retries`);
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function countColumn(action: ActionType) {
  return `${action}_count`;
}

async function ensureUsageRow(supabaseAdmin: ReturnType<typeof createClient>, userId: string) {
  await supabaseAdmin.from('user_daily_usage').upsert(
    { user_id: userId, date: todayIsoDate(), chat_count: 0, image_count: 0, video_count: 0 },
    { onConflict: 'user_id,date', ignoreDuplicates: true },
  );
}

async function readUsage(
  supabaseAdmin: ReturnType<typeof createClient>,
  userId: string,
  action: ActionType,
  isSubscribed: boolean,
) {
  if (isSubscribed) return { allowed: true, remaining: Infinity, current: 0 };

  await ensureUsageRow(supabaseAdmin, userId);
  const column = countColumn(action);
  const { data, error } = await supabaseAdmin
    .from('user_daily_usage')
    .select(column)
    .eq('user_id', userId)
    .eq('date', todayIsoDate())
    .single();

  if (error || !data) {
    console.error('mocka-chat-v2: usage read failed', error?.message);
    return { allowed: true, remaining: FREE_LIMITS[action], current: 0 };
  }

  const current = (data as Record<string, number>)[column] ?? 0;
  return {
    allowed: current < FREE_LIMITS[action],
    remaining: Math.max(0, FREE_LIMITS[action] - current),
    current,
  };
}

async function fallbackConsumeUsage(
  supabaseAdmin: ReturnType<typeof createClient>,
  userId: string,
  action: ActionType,
) {
  const check = await readUsage(supabaseAdmin, userId, action, false);
  if (!check.allowed) return { allowed: false, remaining: 0 };

  const column = countColumn(action);
  const next = check.current + 1;
  await supabaseAdmin
    .from('user_daily_usage')
    .update({ [column]: next, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('date', todayIsoDate());

  return { allowed: true, remaining: Math.max(0, FREE_LIMITS[action] - next) };
}

async function consumeUsage(
  supabaseAdmin: ReturnType<typeof createClient>,
  userId: string,
  action: ActionType,
  isSubscribed: boolean,
) {
  if (isSubscribed) return { allowed: true, remaining: Infinity };

  const { data, error } = await supabaseAdmin.rpc('increment_user_daily_usage', {
    p_user_id: userId,
    p_action: action,
    p_limit: FREE_LIMITS[action],
  });

  if (!error && Array.isArray(data) && data[0]) {
    return { allowed: Boolean(data[0].allowed), remaining: Number(data[0].remaining ?? 0) };
  }

  if (error) {
    console.error('mocka-chat-v2: atomic usage RPC failed, falling back', error.message);
  }
  return fallbackConsumeUsage(supabaseAdmin, userId, action);
}

async function refundUsage(
  supabaseAdmin: ReturnType<typeof createClient>,
  userId: string | null,
  action: ActionType,
  isSubscribed: boolean,
) {
  if (!userId || isSubscribed) return;

  const { error } = await supabaseAdmin.rpc('refund_user_daily_usage', {
    p_user_id: userId,
    p_action: action,
  });

  if (!error) return;

  console.error('mocka-chat-v2: refund RPC failed, falling back', error.message);
  const column = countColumn(action);
  const check = await readUsage(supabaseAdmin, userId, action, false);
  await supabaseAdmin
    .from('user_daily_usage')
    .update({ [column]: Math.max(0, check.current - 1), updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('date', todayIsoDate());
}

function styleHint(style = 'realistic') {
  const styleGuides: Record<string, string> = {
    realistic: 'photorealistic, ultra high resolution, professional photography, sharp focus, natural lighting',
    artistic: 'painterly, fine art, expressive brushwork, gallery-quality illustration',
    anime: 'anime style, vibrant colors, clean linework, detailed anime illustration',
    sketch: 'pencil sketch, detailed line art, graphite drawing, monochromatic',
    cyberpunk: 'cyberpunk aesthetic, neon lights, dark futuristic atmosphere, sci-fi, glowing accents',
    watercolor: 'watercolor painting, soft washes, translucent pigment, gentle paper texture, delicate edges',
    oil: 'classic oil painting, rich brushwork, layered paint texture, museum-quality lighting',
    '3d': 'premium 3D render, cinematic CGI, physically based materials, polished studio lighting',
  };
  return styleGuides[style] ?? styleGuides.realistic;
}

function videoStyleHint(style = 'cinematic') {
  const styleGuides: Record<string, string> = {
    cinematic: 'Cinematic only: live-action film language, film-grade lighting, realistic camera movement, lens depth, and motion-picture color grade. Avoid animation, documentary, and abstract-only visual language.',
    animation: 'Animation only: stylized animated motion, vivid illustrative rendering, expressive timing, and polished animated camera movement. Avoid live-action documentary realism and abstract-only visuals.',
    documentary: 'Documentary only: natural real-world footage, observational camera, grounded movement, authentic lighting, and realistic scene behavior. Avoid stylized animation, cinematic VFX, and abstract visuals.',
    abstract: 'Abstract only: non-literal artistic motion, surreal forms, geometric movement, expressive color, and conceptual visual rhythm. Avoid documentary realism, live-action narrative footage, and character animation.',
  };
  return styleGuides[style] ?? styleGuides.cinematic;
}

function videoPrompt(prompt: string, style?: string) {
  return `${prompt.trim()}\n\nVideo style directive: ${videoStyleHint(style)} The selected style is mandatory for this generation.`.trim();
}

function videoDurationSeconds(duration?: number) {
  return duration === 4 || duration === 8 || duration === 12 ? duration : 8;
}

function videoAspectRatio(aspectRatio?: string) {
  if (aspectRatio === 'portrait' || aspectRatio === '9:16') return 'portrait';
  if (aspectRatio === 'square' || aspectRatio === '1:1') return 'square';
  return 'landscape';
}

function envModelOverride(version: string) {
  const envKey = `ONSPACE_IMAGE_MODEL_${version.toUpperCase().replace(/[^A-Z0-9]/g, '_')}`;
  return Deno.env.get(envKey);
}

function imageModel(version = 'gemini-2.5-flash-image') {
  const modelGuides: Record<string, string> = {
    'gemini-2.5-flash-image': 'MockJ Native profile: fast, prompt-faithful, clean commercial output',
    'hf-flux-dev': 'MockJ Detail profile: high detail, cinematic lighting, strong prompt adherence',
    'hf-flux-schnell': 'MockJ Draft profile: fast iteration, bold composition, clean edges',
    'hf-sdxl': 'MockJ Balanced profile: polished general image generation, balanced realism and art direction',
    'hf-sd35-large': 'MockJ Editorial profile: premium photoreal detail, accurate textures, editorial finish',
    'hf-playground-v25': 'MockJ Social profile: graphic polish, vibrant color, social-ready creative direction',
    'hf-dreamshaper-xl': 'MockJ Fantasy profile: stylized fantasy, portrait, and concept art finish',
    'hf-realvis-xl': 'MockJ Real profile: realistic human portraits, product lighting, natural camera feel',
    'hf-openjourney': 'MockJ Cinema profile: cinematic concept-art composition and dramatic painterly detail',
    'hf-kandinsky-3': 'MockJ Expressive profile: expressive art direction, rich color, surreal editorial mood',
  };

  return {
    model: envModelOverride(version) ?? DEFAULT_IMAGE_MODEL,
    hint: modelGuides[version] ?? modelGuides['gemini-2.5-flash-image'],
  };
}

async function userContext(req: Request, supabaseAdmin: ReturnType<typeof createClient>) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return { userId: null, isSubscribed: false };

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return { userId: null, isSubscribed: false };

  const meta = user.user_metadata ?? {};
  const isSubscribed = meta.subscribed === true || meta.subscription_active === true;
  return { userId: user.id, isSubscribed };
}

function logEvent(event: string, details: Record<string, unknown>) {
  console.log(`[mocka-chat-v2] ${event}`, JSON.stringify(details));
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const apiKey = Deno.env.get('ONSPACE_AI_API_KEY');
  const baseUrl = Deno.env.get('ONSPACE_AI_BASE_URL');
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } },
  );

  try {
    if (!apiKey || !baseUrl) {
      return errorResponse(500, 'config_missing', 'AI service is not configured.');
    }

    const body: RequestBody = await req.json();
    const { userId, isSubscribed } = await userContext(req, supabaseAdmin);

    if ((body.type === 'image' || body.type === 'video-create') && !userId) {
      return errorResponse(401, 'auth_required', 'Sign in required to use this MockJ studio feature.');
    }

    if (userId && body.type !== 'video-check') {
      const action: ActionType = body.type === 'image' ? 'image' : body.type === 'video-create' ? 'video' : 'chat';
      const usage = body.type === 'image'
        ? await readUsage(supabaseAdmin, userId, 'image', isSubscribed)
        : await consumeUsage(supabaseAdmin, userId, action, isSubscribed);

      if (!usage.allowed) {
        return errorResponse(429, 'limit_exceeded', `Daily ${action} limit reached. Upgrade to MockJ Pro for unlimited access.`, {
          limitExceeded: true,
          action,
          remaining: 0,
        });
      }

      logEvent('usage_checked', { userId, action, remaining: usage.remaining });
    }

    if (body.type === 'video-check') {
      const { predictionId } = body as VideoCheckBody;
      if (!predictionId) return errorResponse(400, 'missing_prediction_id', 'predictionId is required.');

      const statusRes = await fetchWithRetry(`${baseUrl}/predictions/${predictionId}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      }, 'video-status');

      if (!statusRes.ok) {
        return errorResponse(statusRes.status, 'video_status_error', 'Video status check failed.', {
          details: sanitizeErrorText(await statusRes.text()),
        });
      }

      const status = await statusRes.json();
      if (status.status === 'failed' || status.status === 'canceled') {
        return errorResponse(500, 'video_failed', status.error ?? 'Video generation failed.');
      }

      if (status.status !== 'succeeded' || !status.output) {
        return jsonResponse({ ok: true, id: predictionId, status: status.status, progress: status.progress ?? 0 });
      }

      const videoRes = await fetchWithRetry(status.output, {}, 'video-download');
      if (!videoRes.ok) {
        return jsonResponse({ ok: true, id: predictionId, status: 'succeeded', videoUrl: status.output });
      }

      const videoBlob = new Blob([await videoRes.arrayBuffer()], { type: 'video/mp4' });
      const fileName = `${predictionId}.mp4`;
      const { error: uploadError } = await supabaseAdmin.storage
        .from('videos')
        .upload(fileName, videoBlob, { contentType: 'video/mp4', upsert: true });

      if (uploadError) {
        console.error('mocka-chat-v2: video storage upload failed', uploadError.message);
        return jsonResponse({ ok: true, id: predictionId, status: 'succeeded', videoUrl: status.output });
      }

      const { data: { publicUrl } } = supabaseAdmin.storage.from('videos').getPublicUrl(fileName);
      return jsonResponse({ ok: true, id: predictionId, status: 'succeeded', videoUrl: publicUrl });
    }

    if (body.type === 'image') {
      const imageBody = body as ImageRequestBody;
      if (!imageBody.prompt?.trim()) return errorResponse(400, 'missing_prompt', 'Prompt is required.');

      const selectedModel = imageModel(imageBody.modelVersion);
      const isEditing = !!imageBody.sourceImageDataUrl;
      const featureHints = [
        imageBody.charConsistency ? 'Maintain consistent character identity, facial structure, wardrobe logic, and recurring details across generations.' : '',
        imageBody.facePreservation ? 'Preserve facial identity and avoid unwanted face distortion, identity swapping, or warped features.' : '',
        imageBody.addWatermark ? 'Embed a subtle MockJ watermark that does not cover the subject or important composition areas.' : '',
        imageBody.privateMode ? 'Treat this as a private workspace generation; avoid public-gallery framing.' : '',
      ].filter(Boolean).join(' ');
      const enhancedPrompt = isEditing
        ? `Edit this image: ${imageBody.prompt}. Apply the change naturally and realistically. Preserve the overall composition except for the described changes. ${selectedModel.hint}. ${featureHints}`.trim()
        : `${imageBody.prompt}. Style: ${styleHint(imageBody.style)}. ${selectedModel.hint}. ${featureHints}`.trim();

      const userContent = isEditing
        ? [
            { type: 'text', text: enhancedPrompt },
            { type: 'image_url', image_url: { url: imageBody.sourceImageDataUrl! } },
          ]
        : enhancedPrompt;

      const aiResponse = await fetchWithRetry(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: selectedModel.model,
          modalities: ['image', 'text'],
          messages: [{ role: 'user', content: userContent }],
          image_config: { aspect_ratio: imageBody.aspectRatio ?? '1:1', image_size: imageBody.quality ?? '1K' },
        }),
      }, 'image-generate');

      if (!aiResponse.ok) {
        return errorResponse(aiResponse.status, 'image_service_error', 'AI image service failed.', {
          details: sanitizeErrorText(await aiResponse.text()),
        });
      }

      const aiData = await aiResponse.json();
      const imageDataUrl: string = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url ?? '';
      const altText: string = aiData.choices?.[0]?.message?.content ?? imageBody.prompt;

      if (!imageDataUrl) {
        return errorResponse(500, 'image_empty', 'No image was generated.');
      }

      if (userId) {
        const usage = await consumeUsage(supabaseAdmin, userId, 'image', isSubscribed);
        if (!usage.allowed) {
          return errorResponse(429, 'limit_exceeded', 'Daily image limit reached. Upgrade to MockJ Pro for unlimited access.', {
            limitExceeded: true,
            action: 'image',
            remaining: 0,
          });
        }
      }

      if (imageBody.privateMode) {
        return jsonResponse({ ok: true, imageUrl: imageDataUrl, altText, private: true, modelUsed: selectedModel.model });
      }

      const base64Data = imageDataUrl.replace(/^data:image\/\w+;base64,/, '');
      const binaryStr = atob(base64Data);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i += 1) bytes[i] = binaryStr.charCodeAt(i);

      const fileName = `mocka/${crypto.randomUUID()}.png`;
      const { error: uploadError } = await supabaseAdmin.storage
        .from('generated-images')
        .upload(fileName, new Blob([bytes], { type: 'image/png' }), {
          contentType: 'image/png',
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('mocka-chat-v2: image upload failed', uploadError.message);
        return jsonResponse({ ok: true, imageUrl: imageDataUrl, altText, modelUsed: selectedModel.model });
      }

      const { data: { publicUrl } } = supabaseAdmin.storage.from('generated-images').getPublicUrl(fileName);
      return jsonResponse({ ok: true, imageUrl: publicUrl, altText, modelUsed: selectedModel.model });
    }

    if (body.type === 'video-create') {
      const videoBody = body as VideoCreateBody;
      if (!videoBody.prompt?.trim()) return errorResponse(400, 'missing_prompt', 'Prompt is required.');
      const seconds = videoDurationSeconds(videoBody.duration);
      const aspectRatio = videoAspectRatio(videoBody.aspectRatio);

      const createRes = await fetchWithRetry(`${baseUrl}/models/openai/sora-2/predictions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          input: {
            prompt: videoPrompt(videoBody.prompt, videoBody.style),
            seconds,
            aspect_ratio: aspectRatio,
          },
        }),
      }, 'video-create');

      if (!createRes.ok) {
        await refundUsage(supabaseAdmin, userId, 'video', isSubscribed);
        return errorResponse(createRes.status, 'video_service_error', 'Video service failed.', {
          details: sanitizeErrorText(await createRes.text()),
        });
      }

      const prediction = await createRes.json();
      return jsonResponse({ ok: true, id: prediction.id, status: prediction.status ?? 'starting' });
    }

    const chatBody = body as ChatRequestBody;
    if (!chatBody.messages || !Array.isArray(chatBody.messages)) {
      return errorResponse(400, 'missing_messages', 'messages array is required.');
    }

    const personalitySuffixes: Record<string, string> = {
      'chill-bro': '',
      'sigma-grindset': 'PERSONALITY OVERRIDE: energetic, direct, action-focused, motivational, and casual.',
      'professor-mode': 'PERSONALITY OVERRIDE: precise, formal, academic, structured, and methodical.',
      'creative-genius': 'PERSONALITY OVERRIDE: imaginative, vivid, artistic, and idea-forward.',
    };

    const systemMessage: ChatMessage = {
      role: 'system',
      content: `You are MockJ, the MoreiraJ/MLTX AI copilot. Be accurate, useful, direct, and brand-aware. Never claim to be another AI system. ${personalitySuffixes[chatBody.personalityPreset ?? 'chill-bro'] ?? ''}${chatBody.knowledgeContext ? `\n\n${chatBody.knowledgeContext}` : ''}`,
    };

    const chatRes = await fetchWithRetry(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: CHAT_MODEL,
        messages: [systemMessage, ...chatBody.messages],
        stream: chatBody.stream ?? false,
      }),
    }, chatBody.stream ? 'chat-stream' : 'chat');

    if (!chatRes.ok) {
      await refundUsage(supabaseAdmin, userId, 'chat', isSubscribed);
      return errorResponse(chatRes.status, 'chat_service_error', 'AI chat service failed.', {
        details: sanitizeErrorText(await chatRes.text()),
      });
    }

    if (chatBody.stream) {
      return new Response(chatRes.body, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    const data = await chatRes.json();
    return jsonResponse({ ok: true, content: data.choices?.[0]?.message?.content ?? '' });
  } catch (error) {
    console.error('mocka-chat-v2: unhandled error', error);
    return errorResponse(500, 'internal_error', 'Internal server error.');
  }
});
