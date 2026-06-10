import { useState, useCallback, useEffect, useRef } from 'react';
import { Image, Video, MessageSquare, Menu, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import ChatWindow from '@/components/features/ChatWindow';
import ImageGeneratorPanel from '@/components/features/ImageGeneratorPanel';
import VideoGeneratorPanel from '@/components/features/VideoGeneratorPanel';
import PromptLibrary from '@/components/features/PromptLibrary';
import SkillCreator from '@/components/features/SkillCreator';
import ProjectBrain from '@/components/features/ProjectBrain';
import PersonalityPicker, { PersonalityPreset, loadPersonality, savePersonality } from '@/components/features/PersonalityPicker';
import PricingModal from '@/components/features/PricingModal';
import WelcomeProModal from '@/components/features/WelcomeProModal';
import { useUsageLimits } from '@/hooks/useUsageLimits';
import { useTokenWallet, TokenAction } from '@/hooks/useTokenWallet';
import { useAuth } from '@/contexts/AuthContext';
import { Conversation, Message, ChatMode } from '@/types/chat';
import {
  loadConversationsLocal,
  saveConversationsLocal,
  loadConversations,
  upsertConversationToCloud,
  deleteConversationFromCloud,
  createConversation,
  generateTitle,
} from '@/lib/storage';
import {
  streamChatResponse,
  generateImage,
  generateVideo,
  buildMessage,
  ChatHistoryMessage,
} from '@/lib/mockAI';
import { PERSONALITY_PRESETS } from '@/components/features/PersonalityPicker';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type TabMode = 'chat' | 'image-studio' | 'video-studio';
type ImageStudioView = 'generate' | 'edit' | 'history';

export default function Index() {
  const [conversations, setConversations] = useState<Conversation[]>(() => loadConversationsLocal());
  const cloudSyncedRef = useRef(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [chatMode, setChatMode] = useState<ChatMode>('chat');
  const [tabMode, setTabMode] = useState<TabMode>('chat');
  const [imageStudioView, setImageStudioView] = useState<ImageStudioView>('generate');
  const [showLibrary, setShowLibrary] = useState(false);
  const [showSkillCreator, setShowSkillCreator] = useState(false);
  const [showBrain, setShowBrain] = useState(false);
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);
  const [deepReasoning, setDeepReasoning] = useState(false);
  const [personality, setPersonality] = useState<PersonalityPreset>(() => loadPersonality());
  const [showPersonality, setShowPersonality] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [showWelcomePro, setShowWelcomePro] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { subscription, user } = useAuth();
  const navigate = useNavigate();
  const { consumeOrBlock, getRemaining, getLimitLabel } = useUsageLimits();
  const { tokenBalance, tokenCosts, canSpendTokens, spendTokens } = useTokenWallet();

  // Sync conversations from cloud when user logs in
  useEffect(() => {
    if (!user) return;
    if (cloudSyncedRef.current) return;
    cloudSyncedRef.current = true;
    loadConversations(user.id).then(cloudConvs => {
      if (cloudConvs.length > 0) {
        setConversations(cloudConvs);
        saveConversationsLocal(cloudConvs);
      }
    });
  }, [user]);

  // Listen for checkout success event fired by PricingModal
  useEffect(() => {
    const handler = () => {
      setShowPricing(false);
      setShowWelcomePro(true);
    };
    window.addEventListener('mockj:checkout-success', handler);
    return () => window.removeEventListener('mockj:checkout-success', handler);
  }, []);

  const handlePersonalityChange = (preset: PersonalityPreset) => {
    setPersonality(preset);
    savePersonality(preset);
    const label = PERSONALITY_PRESETS.find(p => p.id === preset)?.label ?? preset;
    toast.success(`Personality set to ${label}`);
  };

  const activeConv = conversations.find(c => c.id === activeId) ?? null;

  const persist = (convs: Conversation[], changedConv?: Conversation, deletedId?: string) => {
    setConversations(convs);
    saveConversationsLocal(convs);
    if (user) {
      if (changedConv) upsertConversationToCloud(changedConv);
      if (deletedId) deleteConversationFromCloud(deletedId);
    }
  };

  const handleNew = useCallback((mode: ChatMode = 'chat') => {
    const conv = createConversation(mode);
    const updated = [conv, ...conversations];
    persist(updated, conv);
    setActiveId(conv.id);
    setChatMode(mode);
    setTabMode('chat');
  }, [conversations]);

  const handleSelect = (id: string) => {
    setActiveId(id);
    setTabMode('chat');
  };

  const handleDelete = (id: string) => {
    const updated = conversations.filter(c => c.id !== id);
    persist(updated, undefined, id);
    if (activeId === id) setActiveId(updated[0]?.id ?? null);
  };

  const handleSend = async (text: string) => {
    const action: TokenAction = chatMode === 'image' ? 'image' : chatMode === 'video' ? 'video' : 'chat';

    if (!user) {
      toast.error('Create a free MockJ account to use MLTX tokens.');
      navigate('/auth?mode=signup');
      return;
    }

    if (!subscription.subscribed) {
      if (!canSpendTokens(action)) {
        toast.error(`Not enough MLTX tokens. ${tokenCosts[action]} needed for ${action}.`);
        setShowPricing(true);
        return;
      }

      if (action === 'image') {
        if (getRemaining('image') <= 0) {
          toast.error('You used all 10 free images for today. Subscribe monthly to keep generating.');
          setShowPricing(true);
          return;
        }
      } else if (!consumeOrBlock(action)) {
        const label = getLimitLabel(action);
        toast.error(`Daily limit reached (${label.split('/')[1]?.split(' ')[0] ?? ''} free/day). Upgrade to MockJ Pro for unlimited access.`);
        setShowPricing(true);
        return;
      }
    }
    let convId = activeId;
    let convs = conversations;

    if (!convId) {
      const newConv = createConversation(chatMode);
      convs = [newConv, ...conversations];
      convId = newConv.id;
      setActiveId(convId);
    }

    const userMsg = { ...buildMessage('user', text, 'text'), userAvatar: user?.avatar };

    convs = convs.map(c => {
      if (c.id !== convId) return c;
      const msgs = [...c.messages, userMsg];
      return {
        ...c,
        messages: msgs,
        title: msgs.length === 1 ? generateTitle(text) : c.title,
        updatedAt: new Date(),
      };
    });
    persist(convs, convs.find(c => c.id === convId));
    setIsTyping(true);

    try {
      if (chatMode === 'chat') {
        // Build conversation history for context (last 20 messages)
        const currentConv = convs.find(c => c.id === convId);
        const historyMsgs = currentConv?.messages ?? [];
        const history: ChatHistoryMessage[] = historyMsgs
          .slice(-21, -1)
          .filter(m => m.type === 'text')
          .map(m => ({ role: m.role, content: m.content }));

        // Create streaming placeholder message
        const aiMsgId = crypto.randomUUID();
        const streamingMsg: Message = {
          id: aiMsgId,
          role: 'assistant',
          content: '',
          type: 'text',
          timestamp: new Date(),
          streaming: true,
        };

        convs = convs.map(c =>
          c.id === convId ? { ...c, messages: [...c.messages, streamingMsg], updatedAt: new Date() } : c
        );
        setConversations([...convs]);

        // Stream tokens
        let accumulated = '';
        const stream = streamChatResponse(text, history, deepReasoning, personality);

        for await (const chunk of stream) {
          accumulated += chunk;
          const updatedMsg: Message = {
            id: aiMsgId,
            role: 'assistant',
            content: accumulated,
            type: 'text',
            timestamp: new Date(),
            streaming: true,
          };
          convs = convs.map(c => {
            if (c.id !== convId) return c;
            return {
              ...c,
              messages: c.messages.map(m => m.id === aiMsgId ? updatedMsg : m),
              updatedAt: new Date(),
            };
          });
          setConversations([...convs]);
        }

        // Mark streaming done
        const finalMsg: Message = {
          id: aiMsgId,
          role: 'assistant',
          content: accumulated || "I seem to have lost my train of thought. Could you try again?",
          type: 'text',
          timestamp: new Date(),
          streaming: false,
        };
        convs = convs.map(c => {
          if (c.id !== convId) return c;
          return {
            ...c,
            messages: c.messages.map(m => m.id === aiMsgId ? finalMsg : m),
            updatedAt: new Date(),
          };
        });
        persist(convs, convs.find(c => c.id === convId));
        if (!subscription.subscribed) spendTokens('chat');

      } else if (chatMode === 'image') {
        const imageUrl = await generateImage({ prompt: text, style: 'realistic', aspectRatio: '1:1', quality: '1K' });
        const aiMsg = buildMessage('assistant', `Here's your generated image for: "${text}"`, 'image', imageUrl, text);
        convs = convs.map(c =>
          c.id === convId ? { ...c, messages: [...c.messages, aiMsg], updatedAt: new Date() } : c
        );
        persist(convs, convs.find(c => c.id === convId));
        if (!subscription.subscribed) {
          consumeOrBlock('image');
          spendTokens('image');
        }
      } else if (chatMode === 'video') {
        const videoResult = await generateVideo({ prompt: text, style: 'cinematic', duration: '8s', aspectRatio: '16:9' });
        const aiMsg = buildMessage(
          'assistant',
          `Video generated: ${videoResult.label} · ${videoResult.duration}`,
          'video',
          videoResult.thumbnailUrl,
          text
        );
        convs = convs.map(c =>
          c.id === convId ? { ...c, messages: [...c.messages, aiMsg], updatedAt: new Date() } : c
        );
        persist(convs, convs.find(c => c.id === convId));
        if (!subscription.subscribed) spendTokens('video');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      const isLimitErr = (err as { limitExceeded?: boolean }).limitExceeded === true;
      if (isLimitErr) {
        toast.error(message);
        setShowPricing(true);
      } else {
        toast.error(`MockJ: ${message}`);
      }
    } finally {
      setIsTyping(false);
    }
  };

  const handleModeChange = (mode: ChatMode) => {
    setChatMode(mode);
  };

  const handleLibrarySelect = (prompt: string) => {
    setTabMode('chat');
    setChatMode('chat');
    setPendingPrompt(prompt);
  };

  const openImageStudio = (view: ImageStudioView = 'generate') => {
    setImageStudioView(view);
    setTabMode('image-studio');
  };

  const TABS: { mode: TabMode; icon: typeof MessageSquare; label: string }[] = [
    { mode: 'chat', icon: MessageSquare, label: 'AI Copilot' },
    { mode: 'image-studio', icon: Image, label: 'Image Studio' },
    { mode: 'video-studio', icon: Video, label: 'Video Studio' },
  ];

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar — fixed drawer on mobile, static on desktop */}
      <div className={cn(
        'fixed inset-y-0 left-0 z-50 transition-transform duration-300 md:static md:translate-x-0',
        mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <Sidebar
          conversations={conversations}
          activeId={activeId}
          activeConversation={activeConv}
          onSelect={(id) => { handleSelect(id); setMobileSidebarOpen(false); }}
          onNew={(mode) => { handleNew(mode); setMobileSidebarOpen(false); }}
          onDelete={handleDelete}
          onOpenLibrary={() => { setShowLibrary(true); setMobileSidebarOpen(false); }}
          onOpenSkillCreator={() => { setShowSkillCreator(true); setMobileSidebarOpen(false); }}
          onOpenPersonality={() => { setShowPersonality(true); setMobileSidebarOpen(false); }}
          onOpenPricing={() => { setShowPricing(true); setMobileSidebarOpen(false); }}
          currentPersonality={personality}
          onMobileClose={() => setMobileSidebarOpen(false)}
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar — mobile only */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-[hsl(224_20%_5%)] md:hidden">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground transition-all shrink-0"
          >
            <Menu className="w-4 h-4" />
          </button>
          <div className="flex-1 flex items-center justify-center gap-1.5">
            <span className="font-bold text-xs text-foreground flex items-baseline gap-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              MockJ AI
              <span className="text-[10px] font-black" style={{ color: 'hsl(4 90% 58%)', textShadow: '0 0 8px hsl(4 90% 58% / 0.6)' }}>4</span>
            </span>
            {/* Online indicator */}
            <span className="flex items-center gap-1 text-[9px] text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-[hsl(142_70%_55%)] animate-pulse inline-block" />
              online
            </span>
          </div>
          {/* User avatar → Account */}
          <button
            onClick={() => navigate('/account')}
            className="w-8 h-8 rounded-full flex items-center justify-center border border-border overflow-hidden shrink-0 hover:border-[hsl(4_90%_58%_/_0.5)] transition-all"
            title="Account & Billing"
          >
            {user?.avatar
              ? <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
              : <User className="w-3.5 h-3.5 text-muted-foreground" />}
          </button>
        </div>

        {/* Desktop Tab Bar */}
        <div className="hidden md:flex items-center gap-1 px-4 pt-3 pb-0 border-b border-border bg-[hsl(224_20%_6%)]">
          {TABS.map(({ mode, icon: Icon, label }) => (
            <button
              key={mode}
              onClick={() => setTabMode(mode)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all duration-200 border-b-2',
                tabMode === mode
                  ? 'border-[hsl(4_90%_58%)] text-[hsl(4_90%_58%)] bg-[hsl(4_90%_58%_/_0.05)]'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-[hsl(224_15%_24%)]'
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-hidden pb-16 md:pb-0">
          {tabMode === 'chat' && (
            <ChatWindow
              messages={activeConv?.messages ?? []}
              isTyping={isTyping}
              mode={chatMode}
              onModeChange={handleModeChange}
              onSend={handleSend}
              pendingPrompt={pendingPrompt}
              onPendingPromptConsumed={() => setPendingPrompt(null)}
              deepReasoning={deepReasoning}
              onDeepReasoningChange={setDeepReasoning}
              onOpenImageStudio={() => openImageStudio('generate')}
              onOpenVideoStudio={() => setTabMode('video-studio')}
              onOpenProjectBrain={() => setShowBrain(true)}
              onOpenPromptLibrary={() => setShowLibrary(true)}
              onOpenSkillCreator={() => setShowSkillCreator(true)}
              onOpenPricing={() => setShowPricing(true)}
              onOpenAccount={() => navigate(user ? '/account' : '/auth')}
              onOpenWallet={() => navigate('/tokens')}
              onOpenGallery={() => openImageStudio('history')}
              tokenBalance={tokenBalance}
              tokenCosts={tokenCosts}
            />
          )}
          {tabMode === 'image-studio' && <ImageGeneratorPanel initialMode={imageStudioView} />}
          {tabMode === 'video-studio' && <VideoGeneratorPanel />}
        </div>
      </div>

      {showLibrary && (
        <PromptLibrary
          onSelect={handleLibrarySelect}
          onClose={() => setShowLibrary(false)}
        />
      )}

      {showSkillCreator && (
        <SkillCreator
          onClose={() => setShowSkillCreator(false)}
          onSendToChat={(prompt) => {
            setTabMode('chat');
            setChatMode('chat');
            setPendingPrompt(prompt);
          }}
        />
      )}

      {showPersonality && (
        <PersonalityPicker
          current={personality}
          onSelect={handlePersonalityChange}
          onClose={() => setShowPersonality(false)}
        />
      )}

      {showPricing && (
        <PricingModal onClose={() => setShowPricing(false)} />
      )}

      {showWelcomePro && (
        <WelcomeProModal onClose={() => setShowWelcomePro(false)} />
      )}

      {showBrain && <ProjectBrain onClose={() => setShowBrain(false)} />}

      {/* ── Mobile bottom navigation bar ──────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 flex items-stretch border-t border-border bg-[hsl(224_20%_5%)]">
        {TABS.map(({ mode, icon: Icon, label }) => (
          <button
            key={mode}
            onClick={() => setTabMode(mode)}
            className={cn(
              'flex-1 flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-semibold transition-all duration-200',
              tabMode === mode
                ? 'text-[hsl(4_90%_58%)]'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <div className={cn(
              'w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200',
              tabMode === mode
                ? 'bg-[hsl(4_90%_58%_/_0.15)]'
                : 'bg-transparent'
            )}>
              <Icon className="w-4 h-4" />
            </div>
            <span>{label}</span>
            {tabMode === mode && (
              <span className="w-4 h-0.5 rounded-full bg-[hsl(4_90%_58%)] absolute bottom-0" />
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}
