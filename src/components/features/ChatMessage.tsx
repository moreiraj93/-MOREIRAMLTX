import { useState, useCallback, useEffect, useRef } from 'react';
import { Copy, Check, User, Play, ChevronDown, BrainCircuit, Volume2, VolumeX, Loader2 } from 'lucide-react';
import { Message } from '@/types/chat';
import { cn } from '@/lib/utils';
import { useTTS } from '@/hooks/useTTS';
import { getAutoSpeak } from '@/hooks/useAutoSpeak';
import logoImg from '@/assets/mockj-logo.png';

// ─── Reaction persistence ────────────────────────────────────────────────────
const REACTIONS_KEY = 'mocka-reactions';

type ReactionEmoji = '👍' | '💡' | '🔁' | '❤️';
const REACTION_EMOJIS: ReactionEmoji[] = ['👍', '💡', '🔁', '❤️'];

function loadAllReactions(): Record<string, ReactionEmoji[]> {
  try {
    return JSON.parse(localStorage.getItem(REACTIONS_KEY) ?? '{}');
  } catch {
    return {};
  }
}

function saveAllReactions(data: Record<string, ReactionEmoji[]>) {
  localStorage.setItem(REACTIONS_KEY, JSON.stringify(data));
}

function getMessageReactions(msgId: string): ReactionEmoji[] {
  return loadAllReactions()[msgId] ?? [];
}

function toggleReaction(msgId: string, emoji: ReactionEmoji): ReactionEmoji[] {
  const all = loadAllReactions();
  const current = all[msgId] ?? [];
  const next = current.includes(emoji)
    ? current.filter(e => e !== emoji)
    : [...current, emoji];
  saveAllReactions({ ...all, [msgId]: next });
  return next;
}

interface ChatMessageProps {
  message: Message;
}

// ─── Parse reasoning tags ────────────────────────────────────────────────────
interface ParsedContent {
  reasoning: string | null;
  answer: string;
  reasoningPartial: boolean; // still streaming inside <reasoning>
}

function parseReasoningContent(raw: string): ParsedContent {
  const openTag = '<reasoning>';
  const closeTag = '</reasoning>';
  const openIdx = raw.indexOf(openTag);
  if (openIdx === -1) return { reasoning: null, answer: raw, reasoningPartial: false };

  const closeIdx = raw.indexOf(closeTag);
  if (closeIdx === -1) {
    // Reasoning block still streaming
    const reasoning = raw.slice(openIdx + openTag.length);
    return { reasoning, answer: '', reasoningPartial: true };
  }

  const reasoning = raw.slice(openIdx + openTag.length, closeIdx).trim();
  const answer = raw.slice(closeIdx + closeTag.length).trim();
  return { reasoning, answer, reasoningPartial: false };
}

function formatContent(text: string): React.ReactNode {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code block
    if (line.startsWith('```')) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      elements.push(
        <pre key={i} className="bg-[hsl(224_20%_4%)] border border-border rounded-lg p-3 my-2 overflow-x-auto text-xs text-[hsl(4_90%_78%)] font-mono">
          <code>{codeLines.join('\n')}</code>
        </pre>
      );
    }
    // Bold heading **text**
    else if (line.startsWith('**') && line.endsWith('**') && line.length > 4) {
      elements.push(
        <p key={i} className="font-semibold text-foreground mt-3 mb-1">
          {line.slice(2, -2)}
        </p>
      );
    }
    // List item
    else if (line.startsWith('• ') || line.startsWith('- ') || /^\d+\.\s/.test(line)) {
      elements.push(
        <div key={i} className="flex items-start gap-2 my-0.5 text-[hsl(210_20%_85%)]">
          <span className="text-[hsl(4_90%_58%)] mt-0.5 shrink-0">
            {line.startsWith('• ') || line.startsWith('- ') ? '·' : line.match(/^\d+/)?.[0] + '.'}
          </span>
          <span>{line.replace(/^[•-]\s|^\d+\.\s/, '').replace(/\*\*(.*?)\*\*/g, '$1')}</span>
        </div>
      );
    }
    // Empty line
    else if (line.trim() === '') {
      elements.push(<div key={i} className="h-1" />);
    }
    // Normal text with inline bold
    else {
      const parts = line.split(/\*\*(.*?)\*\*/g);
      elements.push(
        <p key={i} className="leading-relaxed text-[hsl(210_20%_85%)]">
          {parts.map((part, pi) =>
            pi % 2 === 1 ? <strong key={pi} className="text-foreground font-semibold">{part}</strong> : part
          )}
        </p>
      );
    }
    i++;
  }

  return <div className="space-y-0.5">{elements}</div>;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const [activeReactions, setActiveReactions] = useState<ReactionEmoji[]>(
    () => getMessageReactions(message.id)
  );
  const [reasoningExpanded, setReasoningExpanded] = useState(true);
  const isUser = message.role === 'user';
  const { speak, stop, isPlaying, isLoading, playbackRate, setSpeed } = useTTS(message.id);
  const autoSpokenRef = useRef(false);

  // Auto-speak: trigger once when a new AI text message finishes streaming
  useEffect(() => {
    if (
      !isUser &&
      message.type === 'text' &&
      !message.streaming &&
      !autoSpokenRef.current &&
      message.content.trim().length > 0
    ) {
      autoSpokenRef.current = true;
      if (getAutoSpeak()) {
        const p = parseReasoningContent(message.content);
        const text = (p.answer || message.content).trim();
        if (text) speak(text);
      }
    }
  }, [message.streaming, message.content, isUser, message.type, speak]);

  // Text content to speak — strip reasoning trace, use only the answer
  const speakableText = !isUser && message.type === 'text'
    ? (() => {
        const p = parseReasoningContent(message.content);
        return (p.answer || message.content).trim();
      })()
    : null;

  const parsed = !isUser && message.type === 'text'
    ? parseReasoningContent(message.content)
    : null;

  const handleReaction = useCallback((emoji: ReactionEmoji) => {
    const next = toggleReaction(message.id, emoji);
    setActiveReactions(next);
  }, [message.id]);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn('flex items-end gap-3 animate-message-in', isUser && 'flex-row-reverse')}>
      {/* Avatar */}
      <div className={cn(
        'w-7 h-7 rounded-full shrink-0 flex items-center justify-center overflow-hidden relative',
        isUser
          ? 'bg-[hsl(265_80%_65%_/_0.2)] ring-1 ring-[hsl(265_80%_65%_/_0.4)]'
          : 'ring-1 ring-[hsl(4_90%_58%_/_0.4)]'
      )}>
        {isUser
          ? (message.userAvatar
              ? <img src={message.userAvatar} alt="You" className="w-full h-full object-cover" />
              : <User className="w-4 h-4 text-[hsl(265_80%_65%)]" />)
          : isPlaying
          ? (
            <div className="w-full h-full bg-[hsl(4_90%_58%_/_0.12)] flex items-end justify-center gap-[2px] pb-1 pt-1">
              <span className="waveform-bar" />
              <span className="waveform-bar" />
              <span className="waveform-bar" />
              <span className="waveform-bar" />
              <span className="waveform-bar" />
            </div>
          )
          : <img src={logoImg} alt="MockJ" className="w-full h-full object-cover" />
        }
      </div>

      {/* Bubble */}
      <div className={cn('group max-w-[75%] flex flex-col gap-1', isUser && 'items-end')}>
        {/* Image message */}
        {message.type === 'image' && message.mediaUrl && (
          <div className="rounded-2xl overflow-hidden border border-border">
            <img
              src={message.mediaUrl}
              alt={message.mediaPrompt || 'Generated image'}
              className="max-w-sm w-full object-cover"
              loading="lazy"
            />
            {message.mediaPrompt && (
              <div className="px-3 py-2 bg-[hsl(224_15%_10%)] text-xs text-muted-foreground">
                "{message.mediaPrompt}"
              </div>
            )}
          </div>
        )}

        {/* Video message */}
        {message.type === 'video' && message.mediaUrl && (
          <div className="rounded-2xl overflow-hidden border border-border relative group/video max-w-sm w-full">
            <img
              src={message.mediaUrl}
              alt="Video thumbnail"
              className="w-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-[hsl(191_97%_55%_/_0.9)] flex items-center justify-center glow-cyan">
                <Play className="w-6 h-6 text-[hsl(224_20%_6%)] ml-1" />
              </div>
            </div>
            {message.mediaPrompt && (
              <div className="px-3 py-2 bg-[hsl(224_15%_10%)] text-xs text-muted-foreground">
                {message.content}
              </div>
            )}
          </div>
        )}

        {/* Text message */}
        {(message.type === 'text' || (message.type !== 'image' && message.type !== 'video') || !message.mediaUrl) && (
          <div className="flex flex-col gap-2 max-w-full">
            {/* Reasoning trace block */}
            {parsed?.reasoning != null && (
              <div className="rounded-xl border border-[hsl(38_95%_60%_/_0.3)] bg-[hsl(38_95%_60%_/_0.05)] overflow-hidden">
                <button
                  onClick={() => setReasoningExpanded(v => !v)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-[hsl(38_95%_60%_/_0.06)] transition-colors duration-150"
                >
                  <BrainCircuit className="w-3.5 h-3.5 text-[hsl(38_95%_60%)] shrink-0" />
                  <span className="text-[11px] font-semibold text-[hsl(38_95%_60%)] flex-1">
                    Reasoning trace
                    {parsed.reasoningPartial && (
                      <span className="ml-2 inline-block w-1.5 h-1.5 rounded-full bg-[hsl(38_95%_60%)] animate-pulse align-middle" />
                    )}
                  </span>
                  <ChevronDown
                    className={cn(
                      'w-3.5 h-3.5 text-[hsl(38_95%_60%_/_0.7)] transition-transform duration-200 shrink-0',
                      reasoningExpanded ? 'rotate-0' : '-rotate-90'
                    )}
                  />
                </button>
                {reasoningExpanded && (
                  <div className="px-3 pb-3 border-t border-[hsl(38_95%_60%_/_0.15)]">
                    <div className="pt-2 text-xs text-[hsl(38_95%_75%)] leading-relaxed font-mono whitespace-pre-wrap opacity-90">
                      {parsed.reasoning}
                      {parsed.reasoningPartial && (
                        <span className="inline-block w-0.5 h-3.5 bg-[hsl(38_95%_60%)] ml-0.5 animate-pulse rounded-full" />
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Main answer bubble */}
            {(parsed ? parsed.answer || (!parsed.reasoningPartial && !parsed.answer) : true) && (
              <div className={cn(
                'rounded-2xl px-4 py-3 text-sm leading-relaxed',
                isUser
                  ? 'bg-[hsl(265_80%_65%_/_0.15)] border border-[hsl(265_80%_65%_/_0.25)] text-foreground rounded-br-sm'
                  : 'bg-[hsl(224_15%_14%)] border border-border rounded-bl-sm'
              )}>
                {isUser ? (
                  <p className="leading-relaxed">{message.content}</p>
                ) : message.streaming && !(parsed ? parsed.answer : message.content) ? (
                  <div className="flex items-center gap-1.5 py-0.5">
                    <span className="w-1.5 h-4 bg-[hsl(4_90%_58%)] rounded-full animate-pulse" />
                  </div>
                ) : (
                  <>
                    {formatContent(parsed ? parsed.answer : message.content)}
                    {message.streaming && !parsed?.reasoningPartial && (
                      <span className="inline-block w-0.5 h-4 bg-[hsl(4_90%_58%)] ml-0.5 animate-pulse rounded-full" />
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Actions row */}
        <div className={cn(
          'flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150',
          isUser && 'flex-row-reverse'
        )}>
          <span className="text-[10px] text-muted-foreground opacity-60">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {!isUser && message.type === 'text' && !message.streaming && (
            <>
              {/* Speak / Stop button */}
              {speakableText && (
                <button
                  onClick={() => isPlaying ? stop() : speak(speakableText)}
                  disabled={isLoading}
                  title={isPlaying ? 'Stop speaking' : isLoading ? 'Loading audio…' : 'Read aloud'}
                  className={cn(
                    'flex items-center gap-1 text-[10px] transition-colors px-1.5 py-0.5 rounded',
                    isPlaying
                      ? 'text-[hsl(4_90%_58%)] bg-[hsl(4_90%_58%_/_0.1)] hover:bg-[hsl(4_90%_58%_/_0.18)]'
                      : isLoading
                      ? 'text-muted-foreground cursor-wait'
                      : 'text-muted-foreground hover:text-foreground hover:bg-[hsl(224_15%_16%)]'
                  )}
                >
                  {isLoading
                    ? <Loader2 className="w-3 h-3 animate-spin" />
                    : isPlaying
                    ? <VolumeX className="w-3 h-3" />
                    : <Volume2 className="w-3 h-3" />
                  }
                  {isLoading ? 'Loading…' : isPlaying ? 'Stop' : 'Speak'}
                </button>
              )}
              {/* Playback speed selector — visible while playing */}
              {isPlaying && (
                <div className="flex items-center gap-0.5 rounded-lg border border-[hsl(4_90%_58%_/_0.25)] bg-[hsl(224_15%_8%)] overflow-hidden">
                  {([0.75, 1, 1.25, 1.5] as const).map(rate => (
                    <button
                      key={rate}
                      onClick={() => setSpeed(rate)}
                      title={`${rate}× speed`}
                      className={cn(
                        'px-1.5 py-0.5 text-[10px] font-semibold transition-all duration-150',
                        playbackRate === rate
                          ? 'bg-[hsl(4_90%_58%)] text-white'
                          : 'text-muted-foreground hover:text-[hsl(4_90%_58%)] hover:bg-[hsl(4_90%_58%_/_0.08)]'
                      )}
                    >
                      {rate}×
                    </button>
                  ))}
                </div>
              )}
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors px-1.5 py-0.5 rounded hover:bg-[hsl(224_15%_16%)]"
              >
                {copied ? <Check className="w-3 h-3 text-[hsl(4_90%_58%)]" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </>
          )}
        </div>

        {/* Emoji Reactions — AI messages only */}
        {!isUser && !message.streaming && (
          <div className={cn(
            'flex items-center gap-1 mt-0.5',
            'opacity-0 group-hover:opacity-100 transition-opacity duration-150'
          )}>
            {REACTION_EMOJIS.map(emoji => {
              const active = activeReactions.includes(emoji);
              return (
                <button
                  key={emoji}
                  onClick={() => handleReaction(emoji)}
                  title={active ? 'Remove reaction' : 'React'}
                  className={cn(
                    'h-6 px-1.5 rounded-lg text-xs border transition-all duration-150 select-none active:scale-90',
                    active
                      ? 'bg-[hsl(4_90%_58%_/_0.15)] border-[hsl(4_90%_58%_/_0.45)] shadow-[0_0_6px_hsl(4_90%_58%_/_0.2)]'
                      : 'bg-[hsl(224_15%_11%)] border-border hover:border-[hsl(224_15%_28%)] hover:bg-[hsl(224_15%_15%)]'
                  )}
                >
                  {emoji}
                  {active && (
                    <span className="ml-1 text-[10px] font-semibold text-[hsl(4_90%_58%)] leading-none">
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
