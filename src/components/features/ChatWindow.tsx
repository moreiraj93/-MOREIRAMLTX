import { useEffect, useRef } from 'react';
import { Message, ChatMode } from '@/types/chat';
import ChatMessage from './ChatMessage';
import TypingIndicator from './TypingIndicator';
import WelcomeScreen from './WelcomeScreen';
import ChatInput from './ChatInput';

interface ChatWindowProps {
  messages: Message[];
  isTyping: boolean;
  mode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
  onSend: (text: string) => void;
  pendingPrompt?: string | null;
  onPendingPromptConsumed?: () => void;
  deepReasoning?: boolean;
  onDeepReasoningChange?: (val: boolean) => void;
  onOpenImageStudio?: () => void;
}

export default function ChatWindow({ messages, isTyping, mode, onModeChange, onSend, pendingPrompt, onPendingPromptConsumed, deepReasoning, onDeepReasoningChange, onOpenImageStudio }: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 && !isTyping ? (
          <WelcomeScreen onSuggestion={onSend} onOpenImageStudio={onOpenImageStudio} />
        ) : (
          <div className="max-w-2xl mx-auto w-full px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-5">
            {messages.map(msg => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            {isTyping && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border bg-background">
        <div className="max-w-2xl mx-auto w-full">
          <ChatInput
            mode={mode}
            onModeChange={onModeChange}
            onSend={onSend}
            disabled={isTyping}
            pendingPrompt={pendingPrompt}
            onPendingPromptConsumed={onPendingPromptConsumed}
            deepReasoning={deepReasoning}
            onDeepReasoningChange={onDeepReasoningChange}
          />
        </div>
      </div>
    </div>
  );
}
