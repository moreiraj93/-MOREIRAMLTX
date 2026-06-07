/**
 * useTTS — ElevenLabs text-to-speech hook for MockJ
 * Calls the `elevenlabs-tts` edge function and plays the returned audio.
 * Manages global playback state so only one message plays at a time.
 */

import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { toast } from 'sonner';

type TTSState = 'idle' | 'loading' | 'playing';

// Global singleton so only one audio plays at a time
let globalAudio: HTMLAudioElement | null = null;
let globalSetState: ((s: TTSState) => void) | null = null;
let globalPlayingId: string | null = null;
let globalPlaybackRate: number = 1;

function stopGlobal() {
  if (globalAudio) {
    globalAudio.pause();
    globalAudio.src = '';
    globalAudio = null;
  }
  if (globalSetState) {
    globalSetState('idle');
    globalSetState = null;
  }
  globalPlayingId = null;
}

export function useTTS(messageId: string) {
  const [state, setState] = useState<TTSState>('idle');
  const [playbackRate, setPlaybackRateState] = useState<number>(globalPlaybackRate);
  const objectUrlRef = useRef<string | null>(null);

  const isPlaying = state === 'playing';
  const isLoading = state === 'loading';

  const speak = useCallback(async (text: string) => {
    // If already playing this message — stop it
    if (globalPlayingId === messageId) {
      stopGlobal();
      setState('idle');
      return;
    }

    // Stop whatever else is playing
    stopGlobal();

    setState('loading');
    globalSetState = setState;
    globalPlayingId = messageId;

    // Revoke previous object URL for this message
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    try {
      const { data, error } = await supabase.functions.invoke('elevenlabs-tts', {
        body: { text },
      });

      if (error) {
        let msg = error.message;
        if (error instanceof FunctionsHttpError) {
          try {
            const raw = await error.context?.text();
            msg = raw || msg;
          } catch { /* ignore */ }
        }
        throw new Error(msg);
      }

      // `data` is an ArrayBuffer (audio/mpeg binary)
      const blob = new Blob([data], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      objectUrlRef.current = url;

      const audio = new Audio(url);
      audio.playbackRate = globalPlaybackRate;
      globalAudio = audio;

      audio.onended = () => {
        URL.revokeObjectURL(url);
        objectUrlRef.current = null;
        globalAudio = null;
        globalPlayingId = null;
        globalSetState = null;
        setState('idle');
      };

      audio.onerror = () => {
        URL.revokeObjectURL(url);
        objectUrlRef.current = null;
        globalAudio = null;
        globalPlayingId = null;
        globalSetState = null;
        setState('idle');
        toast.error('Audio playback failed');
      };

      // If another message took over while we were loading — abort
      if (globalPlayingId !== messageId) {
        URL.revokeObjectURL(url);
        objectUrlRef.current = null;
        setState('idle');
        return;
      }

      setState('playing');
      await audio.play();

    } catch (err: unknown) {
      globalPlayingId = null;
      globalSetState = null;
      setState('idle');
      const msg = err instanceof Error ? err.message : 'TTS failed';
      console.error('[useTTS] Error:', msg);
      toast.error('Voice playback failed. Check your connection.');
    }
  }, [messageId]);

  const stop = useCallback(() => {
    if (globalPlayingId === messageId) {
      stopGlobal();
    }
    setState('idle');
  }, [messageId]);

  const setSpeed = useCallback((rate: number) => {
    globalPlaybackRate = rate;
    if (globalAudio) {
      globalAudio.playbackRate = rate;
    }
    setPlaybackRateState(rate);
  }, []);

  return { speak, stop, state, isPlaying, isLoading, playbackRate, setSpeed };
}
