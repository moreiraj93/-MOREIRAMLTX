import { corsHeaders } from '../_shared/cors.ts';

const ELEVENLABS_VOICE_ID = 'rnINyKVJJCsVUHIOdXVj';
const ELEVENLABS_API_URL = `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`;

// Strip markdown so the TTS reads clean spoken text
function stripMarkdown(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, '') // code blocks
    .replace(/`[^`]+`/g, '')        // inline code
    .replace(/\*\*(.*?)\*\*/g, '$1') // bold
    .replace(/\*(.*?)\*/g, '$1')     // italic
    .replace(/^#{1,6}\s+/gm, '')    // headings
    .replace(/^[-•]\s+/gm, '')      // bullet points
    .replace(/^\d+\.\s+/gm, '')     // numbered lists
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links
    .replace(/<[^>]+>/g, '')        // HTML tags
    .replace(/\n{2,}/g, '. ')       // paragraph breaks → pause
    .replace(/\n/g, ' ')            // single newlines
    .replace(/\s{2,}/g, ' ')        // collapse spaces
    .trim();
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('ELEVENLABS_API_KEY');
    if (!apiKey) {
      console.error('[mltxpro-voice] voice API key not configured');
      return new Response(
        JSON.stringify({ error: 'TTS service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { text } = await req.json() as { text?: string };

    if (!text?.trim()) {
      return new Response(
        JSON.stringify({ error: 'text is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clean and cap the text before sending it to the voice service.
    const cleanText = stripMarkdown(text).slice(0, 5000);
    console.log(`[mltxpro-voice] Generating voice audio, chars=${cleanText.length}`);

    const response = await fetch(ELEVENLABS_API_URL, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
      },
      body: JSON.stringify({
        text: cleanText,
        model_id: 'eleven_turbo_v2_5',
        voice_settings: {
          stability: 0.45,
          similarity_boost: 0.8,
          style: 0.35,
          use_speaker_boost: true,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[mltxpro-voice] voice service error:', response.status, errorText.slice(0, 300));
      return new Response(
        JSON.stringify({ error: `TTS error: ${errorText.slice(0, 200)}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const audioBuffer = await response.arrayBuffer();
    console.log(`[mltxpro-voice] Audio generated, bytes=${audioBuffer.byteLength}`);

    return new Response(audioBuffer, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (err) {
    console.error('[mltxpro-voice] Unexpected error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
