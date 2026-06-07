import { useState, useRef, KeyboardEvent, useEffect, useCallback } from 'react';
import { Send, Image, Video, MessageSquare, Mic, MicOff, BrainCircuit } from 'lucide-react';
import { ChatMode } from '@/types/chat';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  mode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
  onSend: (text: string) => void;
  disabled?: boolean;
  pendingPrompt?: string | null;
  onPendingPromptConsumed?: () => void;
  deepReasoning?: boolean;
  onDeepReasoningChange?: (val: boolean) => void;
}

const MODE_CONFIG = {
  chat: {
    icon: MessageSquare,
    placeholder: 'Yo, ask me anything — I got you 🔥',
    color: 'cyan',
    label: 'Chat',
  },
  image: {
    icon: Image,
    placeholder: 'Describe an image to generate... e.g. "A cyberpunk city at night, neon rain"',
    color: 'violet',
    label: 'Image',
  },
  video: {
    icon: Video,
    placeholder: 'Describe a video scene... e.g. "A timelapse of stars over a mountain lake"',
    color: 'cyan',
    label: 'Video',
  },
} as const;

// Web Speech API type shim
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface SpeechRecognition extends EventTarget {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start(): void;
  stop(): void;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

export default function ChatInput({ mode, onModeChange, onSend, disabled, pendingPrompt, onPendingPromptConsumed, deepReasoning = false, onDeepReasoningChange }: ChatInputProps) {
  const [value, setValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [hasVoiceSupport] = useState(
    () => !!(window.SpeechRecognition || window.webkitSpeechRecognition)
  );
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const config = MODE_CONFIG[mode];

  // Auto-resize textarea helper
  const autoResize = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 160) + 'px';
    }
  }, []);

  // Voice recording
  const handleMicClick = useCallback(() => {
    if (!hasVoiceSupport) return;

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SR();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognitionRef.current = recognition;

    recognition.onresult = (e: SpeechRecognitionEvent) => {
      const transcript = Array.from(e.results)
        .map(r => r[0].transcript)
        .join('');
      setValue(transcript);
      setTimeout(autoResize, 0);
    };

    recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', e.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
      setTimeout(() => textareaRef.current?.focus(), 100);
    };

    recognition.start();
    setIsRecording(true);
  }, [isRecording, hasVoiceSupport, autoResize]);

  // Cleanup on unmount
  useEffect(() => {
    return () => recognitionRef.current?.stop();
  }, []);

  // Auto-fill pending prompt from Prompt Library
  useEffect(() => {
    if (pendingPrompt) {
      setValue(pendingPrompt);
      onPendingPromptConsumed?.();
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
          textareaRef.current.style.height =
            Math.min(textareaRef.current.scrollHeight, 160) + 'px';
          textareaRef.current.focus();
        }
      }, 50);
    }
  }, [pendingPrompt]);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = () => autoResize();

  const isCyan = config.color === 'cyan';

  return (
    <div className="px-2 sm:px-4 pb-3 sm:pb-4 pt-2">
      {/* Mode Tabs + Deep Reasoning toggle */}
      <div className="flex items-center gap-1 sm:gap-1.5 mb-2 sm:mb-3 flex-wrap">
        {(Object.keys(MODE_CONFIG) as ChatMode[]).map(m => {
          const cfg = MODE_CONFIG[m];
          const Icon = cfg.icon;
          const active = m === mode;
          return (
            <button
              key={m}
              onClick={() => onModeChange(m)}
              className={cn(
                'flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200',
                active
                  ? m === 'image'
                    ? 'bg-[hsl(265_80%_65%_/_0.15)] border border-[hsl(265_80%_65%_/_0.4)] text-[hsl(265_80%_65%)]'
                    : 'bg-[hsl(191_97%_55%_/_0.15)] border border-[hsl(191_97%_55%_/_0.4)] text-[hsl(191_97%_55%)]'
                  : 'border border-border text-muted-foreground hover:text-foreground hover:border-[hsl(224_15%_24%)]'
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden xs:inline sm:inline">{cfg.label}</span>
            </button>
          );
        })}

        {/* Deep Reasoning toggle — only in chat mode */}
        {mode === 'chat' && (
          <button
            onClick={() => onDeepReasoningChange?.(!deepReasoning)}
            title={deepReasoning ? 'Deep Reasoning ON — click to disable' : 'Enable Deep Reasoning mode'}
            className={cn(
              'ml-auto flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border',
              deepReasoning
                ? 'bg-[hsl(38_95%_60%_/_0.15)] border-[hsl(38_95%_60%_/_0.45)] text-[hsl(38_95%_60%)] shadow-[0_0_10px_hsl(38_95%_60%_/_0.15)]'
                : 'border-border text-muted-foreground hover:text-foreground hover:border-[hsl(224_15%_24%)]'
            )}
          >
            <BrainCircuit className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Deep Reasoning</span>
            {deepReasoning && (
              <span className="w-1.5 h-1.5 rounded-full bg-[hsl(38_95%_60%)] animate-pulse" />
            )}
          </button>
        )}
      </div>

      {/* Input Area */}
      <div
        className={cn(
          'relative flex items-end gap-3 rounded-2xl border p-3 transition-all duration-200 bg-[hsl(224_15%_10%)]',
          'focus-within:border-opacity-80',
          isCyan
            ? 'border-border focus-within:border-[hsl(191_97%_55%_/_0.5)] focus-within:shadow-[0_0_15px_hsl(191_97%_55%_/_0.1)]'
            : 'border-border focus-within:border-[hsl(265_80%_65%_/_0.5)] focus-within:shadow-[0_0_15px_hsl(265_80%_65%_/_0.1)]'
        )}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          placeholder={config.placeholder}
          disabled={disabled}
          rows={1}
          className="flex-1 bg-transparent resize-none outline-none text-sm text-foreground placeholder:text-muted-foreground/50 leading-relaxed max-h-40 disabled:opacity-50"
          style={{ minHeight: '24px' }}
        />

        <div className="flex items-center gap-2 shrink-0">
          {hasVoiceSupport && (
            <button
              onClick={handleMicClick}
              disabled={disabled}
              aria-label={isRecording ? 'Stop recording' : 'Voice input'}
              className={cn(
                'relative w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 disabled:opacity-40',
                isRecording
                  ? 'bg-destructive/20 border border-destructive/60 text-destructive shadow-[0_0_10px_hsl(0_80%_55%_/_0.25)]'
                  : 'border border-border text-muted-foreground hover:text-foreground hover:border-[hsl(224_15%_24%)]'
              )}
            >
              {isRecording ? (
                <>
                  <MicOff className="w-3.5 h-3.5" />
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-destructive animate-ping" />
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-destructive" />
                </>
              ) : (
                <Mic className="w-3.5 h-3.5" />
              )}
            </button>
          )}
          <button
            onClick={handleSend}
            disabled={!value.trim() || disabled}
            className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 active:scale-90',
              value.trim() && !disabled
                ? isCyan
                  ? 'bg-[hsl(191_97%_55%)] text-[hsl(224_20%_6%)] hover:bg-[hsl(191_97%_65%)] glow-cyan'
                  : 'bg-[hsl(265_80%_65%)] text-white hover:bg-[hsl(265_80%_72%)] glow-violet'
                : 'bg-[hsl(224_15%_14%)] text-muted-foreground cursor-not-allowed'
            )}
            aria-label="Send"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground/40 text-center mt-2">
        MockJ keeps it real, but double-check anything critical ngl 🤙
      </p>
    </div>
  );
}
