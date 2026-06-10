import { useState, useEffect } from 'react';
import { Plus, MessageSquare, Trash2, Image, Video, ChevronLeft, ChevronRight, Sparkles, BookOpen, Download, Smile, Crown, LogIn, LogOut, User, Brain, Volume2, VolumeX, Settings, X, Coins } from 'lucide-react';
import { getAutoSpeak, toggleAutoSpeak } from '@/hooks/useAutoSpeak';
import ProjectBrain from '@/components/features/ProjectBrain';
import { Conversation, ChatMode } from '@/types/chat';
import { cn } from '@/lib/utils';
import logoImg from '@/assets/mockj-logo.png';
import { toast } from 'sonner';
import { PERSONALITY_PRESETS, PersonalityPreset } from '@/components/features/PersonalityPicker';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface SidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  activeConversation: Conversation | null;
  onSelect: (id: string) => void;
  onNew: (mode?: ChatMode) => void;
  onDelete: (id: string) => void;
  onOpenLibrary: () => void;
  onOpenPersonality: () => void;
  onOpenPricing: () => void;
  currentPersonality: PersonalityPreset;
  onMobileClose?: () => void;
}

function exportConversation(conv: Conversation) {
  const lines: string[] = [];
  lines.push(`# ${conv.title}`);
  lines.push(`*Exported from MockJ · ${new Date().toLocaleString()}*`);
  lines.push(`*Mode: ${conv.mode} · Messages: ${conv.messages.length}*`);
  lines.push('');
  lines.push('---');
  lines.push('');
  for (const msg of conv.messages) {
    const time = msg.timestamp
      ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '';
    const role = msg.role === 'user' ? '**You**' : '**MockJ**';
    const timeLabel = time ? ` *(${time})*` : '';
    lines.push(`### ${role}${timeLabel}`);
    lines.push('');
    if (msg.type === 'image' && msg.mediaUrl) {
      lines.push(`![Generated Image](${msg.mediaUrl})`);
      if (msg.mediaPrompt) lines.push(`*Prompt: ${msg.mediaPrompt}*`);
    } else if (msg.type === 'video') {
      lines.push(`🎬 *Video generated*`);
      if (msg.mediaPrompt) lines.push(`*Prompt: ${msg.mediaPrompt}*`);
      if (msg.mediaUrl) lines.push(`[Watch Video](${msg.mediaUrl})`);
    } else {
      lines.push(msg.content);
    }
    lines.push('');
    lines.push('---');
    lines.push('');
  }
  lines.push(`*End of conversation · MockJ*`);
  const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `mockj-${conv.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}-${Date.now()}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

const modeIcon = (mode: ChatMode) => {
  if (mode === 'image') return <Image className="w-3.5 h-3.5 shrink-0" />;
  if (mode === 'video') return <Video className="w-3.5 h-3.5 shrink-0" />;
  return <MessageSquare className="w-3.5 h-3.5 shrink-0" />;
};

export default function Sidebar({
  conversations,
  activeId,
  activeConversation,
  onSelect,
  onNew,
  onDelete,
  onOpenLibrary,
  onOpenPersonality,
  onOpenPricing,
  currentPersonality,
  onMobileClose,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [showBrain, setShowBrain] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(() => getAutoSpeak());
  const { user, subscription, logout } = useAuth();
  const navigate = useNavigate();

  // Sync auto-speak state when toggled from elsewhere
  useEffect(() => {
    const handler = (e: Event) => {
      setAutoSpeak((e as CustomEvent<{ enabled: boolean }>).detail.enabled);
    };
    window.addEventListener('mockj:autospeak-change', handler);
    return () => window.removeEventListener('mockj:autospeak-change', handler);
  }, []);

  const handleAutoSpeakToggle = () => {
    const next = toggleAutoSpeak();
    setAutoSpeak(next);
    toast.success(next ? 'Auto-Speak on. Say "Hey MockJ" to talk hands-free.' : 'Auto-Speak off.');
  };

  return (
    <>
      <aside
        className={cn(
          'flex flex-col h-full transition-all duration-300 border-r border-border relative',
          'bg-[hsl(224_20%_5%)]',
          collapsed ? 'w-14' : 'w-64 md:w-64'
        )}
        style={{ width: collapsed ? '3.5rem' : '16rem' }}
      >
        {/* Logo / Brand */}
        <div className={cn('flex items-center gap-3 px-4 py-4 border-b border-border', collapsed && 'justify-center px-2')}>
          <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 animate-pulse-glow ring-1" style={{ outline: '1px solid hsl(4 90% 58% / 0.4)' }}>
            <img src={logoImg} alt="MockJ" className="w-full h-full object-cover" />
          </div>
          {!collapsed && (
            <div className="flex-1 flex items-center justify-between">
              <div>
                <h1 className="font-bold text-base text-foreground leading-none flex items-baseline gap-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  MockJ AI
                  <span className="text-xs font-black" style={{ color: 'hsl(4 90% 58%)', textShadow: '0 0 10px hsl(4 90% 58% / 0.6)' }}>4</span>
                </h1>
                <p className="text-[10px] mt-0.5 leading-none" style={{ color: 'hsl(4 90% 58%)' }}>MoreiraJ / MLTX · Crew</p>
              </div>
              {/* Mobile close button */}
              {onMobileClose && (
                <button
                  onClick={onMobileClose}
                  className="md:hidden w-7 h-7 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground transition-all"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* User Profile Strip */}
        {!collapsed && (
          <div className="px-3 pt-3 pb-1">
            {user ? (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[hsl(224_15%_10%)] border border-border">
                <div className="w-7 h-7 rounded-full overflow-hidden bg-[hsl(4_90%_58%_/_0.15)] border border-[hsl(4_90%_58%_/_0.4)] flex items-center justify-center shrink-0">
                  {user.avatar
                    ? <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
                    : <User className="w-3.5 h-3.5 text-[hsl(4_90%_58%)]" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-medium text-foreground truncate">{user.username}</p>
                    {subscription.subscribed && (
                      <span
                        className="shrink-0 inline-flex items-center justify-center w-4 h-4 rounded-full"
                        style={{
                          background: 'linear-gradient(135deg, hsl(191 97% 55%), hsl(265 80% 65%))',
                          boxShadow: '0 0 8px hsl(191 97% 55% / 0.7), 0 0 16px hsl(191 97% 55% / 0.4)',
                          animation: 'pulse 2s ease-in-out infinite',
                        }}
                        title="MockJ Pro active"
                      >
                        <Crown className="w-2 h-2 text-[hsl(224_20%_6%)]" />
                      </span>
                    )}
                  </div>
                  {subscription.subscribed ? (
                    <p className="text-[10px] text-[hsl(191_97%_55%)] flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[hsl(191_97%_55%)] animate-pulse inline-block" />
                      MockJ {subscription.tier === 'sale' ? 'Intro' : 'Pro'} - Active
                    </p>
                  ) : (
                    <p className="text-[10px] text-muted-foreground">Free plan</p>
                  )}
                </div>
                <button
                  onClick={async () => { await logout(); toast.success('Signed out'); }}
                  className="w-6 h-6 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                  title="Sign out"
                >
                  <LogOut className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => navigate('/auth')}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-border text-xs text-muted-foreground hover:text-[hsl(191_97%_55%)] hover:border-[hsl(191_97%_55%_/_0.4)] transition-all duration-200"
              >
                <LogIn className="w-3.5 h-3.5" />
                Sign in / Create account
              </button>
            )}
          </div>
        )}

        {/* New Chat Button */}
        <div className={cn('p-3', collapsed && 'px-2')}>
          <button
            onClick={() => onNew('chat')}
            className={cn(
              'flex items-center gap-2 rounded-lg transition-all duration-200 text-sm font-medium',
              'bg-[hsl(4_90%_58%)] text-white hover:bg-[hsl(4_90%_65%)]',
              'active:scale-95',
              collapsed ? 'w-full justify-center p-2' : 'w-full px-3 py-2'
            )}
          >
            <Plus className="w-4 h-4 shrink-0" />
            {!collapsed && <span>New Chat</span>}
          </button>
        </div>

        {/* Quick Create Buttons */}
        {!collapsed && (
          <div className="px-3 pb-2 flex gap-2">
            <button
              onClick={() => onNew('image')}
              className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium border border-border text-muted-foreground hover:border-[hsl(265_80%_65%)] hover:text-[hsl(265_80%_65%)] transition-all duration-200"
            >
              <Image className="w-3 h-3" /> Image
            </button>
            <button
              onClick={() => onNew('video')}
              className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium border border-border text-muted-foreground hover:border-[hsl(4_90%_58%)] hover:text-[hsl(4_90%_58%)] transition-all duration-200"
            >
              <Video className="w-3 h-3" /> Video
            </button>
          </div>
        )}

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5">
          {!collapsed && conversations.length === 0 && (
            <div className="text-center py-8">
              <Sparkles className="w-6 h-6 text-muted-foreground mx-auto mb-2 opacity-40" />
              <p className="text-xs text-muted-foreground opacity-60">No conversations yet</p>
            </div>
          )}
          {conversations.map(conv => (
            <div
              key={conv.id}
              onMouseEnter={() => setHoveredId(conv.id)}
              onMouseLeave={() => setHoveredId(null)}
              className={cn(
                'group flex items-center gap-2 rounded-lg cursor-pointer transition-all duration-150',
                collapsed ? 'justify-center p-2' : 'px-2 py-2',
                activeId === conv.id
                  ? 'bg-[hsl(224_15%_16%)] text-foreground'
                  : 'text-muted-foreground hover:bg-[hsl(224_15%_12%)] hover:text-foreground'
              )}
              onClick={() => onSelect(conv.id)}
            >
              <span className={cn(activeId === conv.id ? 'text-[hsl(4_90%_58%)]' : 'text-muted-foreground')}>
                {modeIcon(conv.mode)}
              </span>
              {!collapsed && (
                <>
                  <span className="flex-1 text-xs truncate">{conv.title}</span>
                  {hoveredId === conv.id && (
                    <button
                      onClick={e => { e.stopPropagation(); onDelete(conv.id); }}
                      className="shrink-0 opacity-60 hover:opacity-100 hover:text-destructive transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </>
              )}
            </div>
          ))}
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(v => !v)}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[hsl(224_15%_14%)] border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-[hsl(191_97%_55%)] transition-all duration-200 z-10"
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>

        {/* Bottom Actions */}
        <div className={cn('p-3 border-t border-border space-y-1.5', collapsed && 'px-2')}>
          {/* Upgrade / Pro Status */}
          {!subscription.subscribed ? (
            <button
              onClick={onOpenPricing}
              className={cn(
                'flex items-center gap-2 rounded-lg transition-all duration-200 text-xs font-medium w-full',
                'bg-[hsl(4_90%_58%_/_0.1)] border border-[hsl(4_90%_58%_/_0.4)] text-[hsl(4_90%_58%)] hover:bg-[hsl(4_90%_58%_/_0.18)]',
                collapsed ? 'justify-center p-2' : 'px-3 py-2'
              )}
            >
              <Crown className="w-3.5 h-3.5 shrink-0" />
              {!collapsed && <span>Upgrade to Pro</span>}
            </button>
          ) : (
            <button
              onClick={onOpenPricing}
              className={cn(
                'flex items-center gap-2 rounded-lg transition-all duration-200 text-xs font-medium w-full',
                'border border-[hsl(4_90%_58%_/_0.3)] text-[hsl(4_90%_58%)] bg-[hsl(4_90%_58%_/_0.06)] hover:bg-[hsl(4_90%_58%_/_0.12)]',
                collapsed ? 'justify-center p-2' : 'px-3 py-2'
              )}
            >
              <Crown className="w-3.5 h-3.5 shrink-0" />
              {!collapsed && <span>MockJ {subscription.tier === 'sale' ? 'Intro' : 'Pro'} ✓</span>}
            </button>
          )}

          {/* Export Chat */}
          <button
            onClick={() => {
              if (!activeConversation || activeConversation.messages.length === 0) {
                toast.error('No messages to export. Start a conversation first.');
                return;
              }
              exportConversation(activeConversation);
              toast.success('Chat exported as Markdown!');
            }}
            className={cn(
              'flex items-center gap-2 rounded-lg transition-all duration-200 text-xs font-medium w-full border border-border text-muted-foreground hover:border-[hsl(4_90%_58%_/_0.5)] hover:text-[hsl(4_90%_58%)] hover:bg-[hsl(4_90%_58%_/_0.06)]',
              collapsed ? 'justify-center p-2' : 'px-3 py-2'
            )}
          >
            <Download className="w-3.5 h-3.5 shrink-0" />
            {!collapsed && <span>Export Chat</span>}
          </button>

          {/* Prompt Library */}
          <button
            onClick={onOpenLibrary}
            className={cn(
              'flex items-center gap-2 rounded-lg transition-all duration-200 text-xs font-medium w-full',
              'border border-border text-muted-foreground hover:border-[hsl(265_80%_65%_/_0.5)] hover:text-[hsl(265_80%_65%)] hover:bg-[hsl(265_80%_65%_/_0.06)]',
              collapsed ? 'justify-center p-2' : 'px-3 py-2'
            )}
          >
            <BookOpen className="w-3.5 h-3.5 shrink-0" />
            {!collapsed && <span>Prompt Library</span>}
          </button>

          {/* Project Brain */}
          <button
            onClick={() => setShowBrain(true)}
            className={cn(
              'flex items-center gap-2 rounded-lg transition-all duration-200 text-xs font-medium w-full border border-border text-muted-foreground hover:border-[hsl(4_90%_58%_/_0.5)] hover:text-[hsl(4_90%_58%)] hover:bg-[hsl(4_90%_58%_/_0.05)]',
              collapsed ? 'justify-center p-2' : 'px-3 py-2'
            )}
          >
            <Brain className="w-3.5 h-3.5 shrink-0" />
            {!collapsed && <span>Project Brain</span>}
          </button>

          {/* Auto-Speak Toggle */}
          <button
            onClick={handleAutoSpeakToggle}
            className={cn(
              'flex items-center gap-2 rounded-lg transition-all duration-200 text-xs font-medium w-full border',
              collapsed ? 'justify-center p-2' : 'px-3 py-2',
              autoSpeak
                ? 'bg-[hsl(4_90%_58%_/_0.1)] border-[hsl(4_90%_58%_/_0.45)] text-[hsl(4_90%_58%)]'
                : 'border-border text-muted-foreground hover:border-[hsl(4_90%_58%_/_0.4)] hover:text-[hsl(4_90%_58%)] hover:bg-[hsl(4_90%_58%_/_0.05)]'
            )}
            title={autoSpeak ? 'Auto-Speak is ON — say "Hey MockJ" to start talking' : 'Auto-Speak is OFF — click to enable wake word listening'}
          >
            {autoSpeak
              ? <Volume2 className="w-3.5 h-3.5 shrink-0" />
              : <VolumeX className="w-3.5 h-3.5 shrink-0" />
            }
            {!collapsed && (
              <span className="flex-1 text-left">Auto-Speak</span>
            )}
            {!collapsed && (
              <span className={cn(
                'text-[9px] font-bold px-1.5 py-0.5 rounded-full',
                autoSpeak
                  ? 'bg-[hsl(4_90%_58%_/_0.2)] text-[hsl(4_90%_58%)]'
                  : 'bg-[hsl(224_15%_16%)] text-muted-foreground'
              )}>
                {autoSpeak ? 'ON' : 'OFF'}
              </span>
            )}
          </button>

          {/* Tokens */}
          <button
            onClick={() => navigate('/tokens')}
            className={cn(
              'flex items-center gap-2 rounded-lg transition-all duration-200 text-xs font-medium w-full border border-[hsl(38_95%_60%_/_0.45)] text-[hsl(38_95%_60%)] bg-[hsl(38_95%_60%_/_0.08)] hover:bg-[hsl(38_95%_60%_/_0.14)]',
              collapsed ? 'justify-center p-2' : 'px-3 py-2'
            )}
          >
            <Coins className="w-3.5 h-3.5 shrink-0" />
            {!collapsed && <span>Tokens</span>}
          </button>

          {/* Account / Settings */}
          <button
            onClick={() => navigate('/account')}
            className={cn(
              'flex items-center gap-2 rounded-lg transition-all duration-200 text-xs font-medium w-full border border-border text-muted-foreground hover:border-[hsl(265_80%_65%_/_0.5)] hover:text-[hsl(265_80%_65%)] hover:bg-[hsl(265_80%_65%_/_0.06)]',
              collapsed ? 'justify-center p-2' : 'px-3 py-2'
            )}
          >
            <Settings className="w-3.5 h-3.5 shrink-0" />
            {!collapsed && <span>Account & Billing</span>}
          </button>

          {/* Personality Preset */}
          {(() => {
            const preset = PERSONALITY_PRESETS.find(p => p.id === currentPersonality);
            return (
              <button
                onClick={onOpenPersonality}
                className={cn(
                  'flex items-center gap-2 rounded-lg transition-all duration-200 text-xs font-medium w-full border',
                  collapsed ? 'justify-center p-2' : 'px-3 py-2'
                )}
                style={{
                  borderColor: preset ? `hsl(${preset.color.replace('hsl(', '').replace(')', '').trim()} / 0.35)` : 'hsl(224 15% 20%)',
                  color: preset?.color ?? 'hsl(210 20% 60%)',
                  backgroundColor: preset ? `hsl(${preset.color.replace('hsl(', '').replace(')', '').trim()} / 0.06)` : 'transparent',
                }}
              >
                <Smile className="w-3.5 h-3.5 shrink-0" />
                {!collapsed && <span className="truncate">{preset?.label ?? 'Personality'}</span>}
              </button>
            );
          })()}
        </div>

        {/* Footer */}
        {!collapsed && (
          <div className="px-4 py-2 pb-3">
            <p className="text-[10px] text-muted-foreground opacity-50 text-center">MockJ AI · MoreiraJ · MLTX</p>
          </div>
        )}
      </aside>

      {showBrain && <ProjectBrain onClose={() => setShowBrain(false)} />}
    </>
  );
}
