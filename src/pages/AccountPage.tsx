import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Crown, Zap, MessageSquare, Image, Video, Calendar, CreditCard,
  ArrowLeft, RefreshCw, CheckCircle, AlertCircle, Loader2, User,
  Sparkles, Lock, Camera, Upload,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUsageLimits } from '@/hooks/useUsageLimits';
import { supabase } from '@/lib/supabase';
import { postAuthedApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import logoImg from '@/assets/mockj-logo.png';

const FREE_LIMITS = { chat: 10, image: 3, video: 1 };

function UsageMeter({
  label,
  icon: Icon,
  used,
  total,
  color,
}: {
  label: string;
  icon: React.ElementType;
  used: number;
  total: number | typeof Infinity;
  color: string;
}) {
  const isUnlimited = total === Infinity;
  const pct = isUnlimited ? 100 : Math.min(100, (used / total) * 100);
  const remaining = isUnlimited ? '∞' : Math.max(0, total - used);
  const almostOut = !isUnlimited && (total - used) <= 1;

  return (
    <div className="flex flex-col gap-2 p-4 rounded-2xl bg-[hsl(224_15%_9%)] border border-border hover:border-[hsl(224_15%_20%)] transition-all duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{
              background: `${color.replace(')', ' / 0.12)')}`,
              border: `1px solid ${color.replace(')', ' / 0.3)')}`,
            }}
          >
            <Icon className="w-3.5 h-3.5" style={{ color }} />
          </div>
          <span className="text-sm font-medium text-foreground">{label}</span>
        </div>
        <div className="text-right">
          {isUnlimited ? (
            <span className="text-xs font-bold" style={{ color: 'hsl(4 90% 58%)' }}>Unlimited</span>
          ) : (
            <span className={cn('text-xs font-bold', almostOut ? 'text-[hsl(0_70%_60%)]' : 'text-foreground')}>
              {remaining} left
            </span>
          )}
        </div>
      </div>

      <div className="h-1.5 rounded-full bg-[hsl(224_15%_14%)] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            background: isUnlimited
              ? 'linear-gradient(90deg, hsl(4 90% 58%), hsl(265 80% 65%))'
              : almostOut
              ? 'hsl(0 70% 55%)'
              : color,
          }}
        />
      </div>

      {!isUnlimited && (
        <p className="text-[10px] text-muted-foreground">
          {used} of {total} used today · resets at midnight UTC
        </p>
      )}
    </div>
  );
}

// ── Avatar Upload Component ──────────────────────────────────────────────────
function AvatarUpload({ userId, currentAvatar }: { userId: string; currentAvatar?: string }) {
  const { refreshUser } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentAvatar ?? null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }
    if (!file.type.startsWith('image/')) { toast.error('Please upload an image file'); return; }

    // Show local preview immediately
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);

    setUploading(true);
    try {
      const ext = file.name.split('.').pop() ?? 'jpg';
      const path = `${userId}/avatar.${ext}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(path);

      // Force cache-bust so browser loads the fresh image
      const avatarUrl = `${publicUrl}?t=${Date.now()}`;

      // Update Supabase user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: avatarUrl },
      });
      if (updateError) throw updateError;

      // Refresh auth context so Sidebar + ChatMessage update
      await refreshUser();
      setPreview(avatarUrl);
      toast.success('Avatar updated!');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
      setPreview(currentAvatar ?? null);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative group shrink-0">
      {/* Avatar circle */}
      <div
        className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-[hsl(4_90%_58%_/_0.4)] bg-[hsl(4_90%_58%_/_0.1)] flex items-center justify-center cursor-pointer"
        onClick={() => !uploading && fileRef.current?.click()}
        title="Click to upload new avatar"
      >
        {preview ? (
          <img
            src={preview}
            alt="Avatar"
            className="w-full h-full object-cover"
          />
        ) : (
          <User className="w-6 h-6 text-[hsl(4_90%_58%)]" />
        )}
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-2xl flex items-center justify-center">
          {uploading
            ? <Loader2 className="w-5 h-5 text-white animate-spin" />
            : <Camera className="w-5 h-5 text-white" />
          }
        </div>
      </div>

      {/* Upload badge */}
      <button
        onClick={() => !uploading && fileRef.current?.click()}
        disabled={uploading}
        className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full flex items-center justify-center border-2 border-[hsl(224_20%_5%)] transition-all"
        style={{ background: 'hsl(4 90% 58%)' }}
        title="Upload photo"
      >
        {uploading
          ? <Loader2 className="w-3 h-3 text-white animate-spin" />
          : <Upload className="w-3 h-3 text-white" />
        }
      </button>

      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function AccountPage() {
  const navigate = useNavigate();
  const { user, subscription, refreshSubscription } = useAuth();
  const { getRemaining, getLimit } = useUsageLimits();
  const [portalLoading, setPortalLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const isPro = subscription.subscribed;
  const tierLabel = subscription.tier === 'sale' ? 'Intro' : 'Pro';
  const renewDate = subscription.subscriptionEnd
    ? new Date(subscription.subscriptionEnd).toLocaleDateString(undefined, {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : null;

  const usageMetrics = [
    {
      label: 'Chat Messages',
      icon: MessageSquare,
      color: 'hsl(4 90% 58%)',
      used: isPro ? 0 : FREE_LIMITS.chat - getRemaining('chat'),
      total: isPro ? Infinity : FREE_LIMITS.chat,
    },
    {
      label: 'Image Generations',
      icon: Image,
      color: 'hsl(265 80% 65%)',
      used: isPro ? 0 : FREE_LIMITS.image - getRemaining('image'),
      total: isPro ? Infinity : FREE_LIMITS.image,
    },
    {
      label: 'Video Generations',
      icon: Video,
      color: 'hsl(38 95% 60%)',
      used: isPro ? 0 : FREE_LIMITS.video - getRemaining('video'),
      total: isPro ? Infinity : FREE_LIMITS.video,
    },
  ];

  const handleManageSubscription = async () => {
    if (!user?.email) { toast.error('You must be signed in to manage your subscription.'); return; }
    setPortalLoading(true);
    try {
      const data = await postAuthedApi<{ url?: string }>('/api/customer-portal');
      if (!data?.url) throw new Error('Portal did not return a Stripe URL');
      window.open(data.url, '_blank');
    } catch (error) {
      toast.error(`Could not open billing portal: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setPortalLoading(false);
      return;
    }
    setPortalLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshSubscription();
    setRefreshing(false);
    toast.success('Subscription status refreshed');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="flex items-center gap-3 px-6 py-4 border-b border-border bg-[hsl(224_20%_5%)]">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to MockJ
        </button>
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg overflow-hidden">
            <img src={logoImg} alt="MockJ" className="w-full h-full object-cover" />
          </div>
          <span className="font-bold text-sm text-foreground" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            MockJ <span style={{ color: 'hsl(4 90% 58%)' }}>4</span>
          </span>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-10 space-y-6">
        {/* Page title */}
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            My Account
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your profile, plan, usage, and billing settings.
          </p>
        </div>

        {/* Profile card */}
        <div className="flex items-center gap-4 p-5 rounded-2xl bg-[hsl(224_15%_9%)] border border-border">
          {user ? (
            <AvatarUpload userId={user.id} currentAvatar={user.avatar} />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-[hsl(4_90%_58%_/_0.1)] border border-[hsl(4_90%_58%_/_0.3)] flex items-center justify-center shrink-0">
              <User className="w-6 h-6 text-[hsl(4_90%_58%)]" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground truncate">{user?.username ?? 'Anonymous'}</p>
            <p className="text-sm text-muted-foreground truncate">{user?.email ?? 'Not signed in'}</p>
            {user && (
              <p className="text-[11px] text-muted-foreground/50 mt-0.5">
                Click avatar to upload a new photo
              </p>
            )}
          </div>
          {isPro && (
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shrink-0"
              style={{
                background: 'linear-gradient(135deg, hsl(4 90% 58% / 0.15), hsl(265 80% 65% / 0.15))',
                border: '1px solid hsl(4 90% 58% / 0.4)',
                color: 'hsl(4 90% 78%)',
              }}
            >
              <Crown className="w-3 h-3" />
              MockJ {tierLabel}
            </div>
          )}
        </div>

        {/* Plan card */}
        <div
          className={cn(
            'relative rounded-2xl border p-6 overflow-hidden',
            isPro
              ? 'border-[hsl(4_90%_58%_/_0.35)] bg-[hsl(224_15%_8%)]'
              : 'border-border bg-[hsl(224_15%_9%)]'
          )}
        >
          {isPro && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse 80% 60% at 50% -10%, hsl(4 90% 58% / 0.07) 0%, transparent 70%)' }}
            />
          )}

          <div className="relative flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  'w-12 h-12 rounded-2xl flex items-center justify-center shrink-0',
                  isPro
                    ? 'bg-gradient-to-br from-[hsl(4_90%_58%_/_0.2)] to-[hsl(265_80%_65%_/_0.2)] border border-[hsl(4_90%_58%_/_0.4)]'
                    : 'bg-[hsl(224_15%_14%)] border border-border'
                )}
              >
                {isPro
                  ? <Crown className="w-5 h-5 text-[hsl(4_90%_58%)]" />
                  : <Zap className="w-5 h-5 text-muted-foreground" />
                }
              </div>
              <div>
                <h2 className="font-bold text-foreground text-base" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {isPro ? `MockJ ${tierLabel}` : 'Free Plan'}
                </h2>
                <div className="flex items-center gap-1.5 mt-1">
                  {isPro ? (
                    <>
                      <CheckCircle className="w-3.5 h-3.5 text-[hsl(142_70%_55%)]" />
                      <span className="text-xs text-[hsl(142_70%_65%)] font-medium">Active subscription</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Limited daily usage</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-muted-foreground border border-border hover:text-foreground hover:border-[hsl(224_15%_24%)] transition-all"
            >
              <RefreshCw className={cn('w-3 h-3', refreshing && 'animate-spin')} />
              Refresh
            </button>
          </div>

          {isPro && renewDate && (
            <div className="relative mt-5 flex flex-wrap gap-4">
              <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-[hsl(224_15%_6%)] border border-border flex-1 min-w-0">
                <Calendar className="w-4 h-4 text-[hsl(4_90%_58%)] shrink-0" />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Next renewal</p>
                  <p className="text-sm font-semibold text-foreground">{renewDate}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-[hsl(224_15%_6%)] border border-border flex-1 min-w-0">
                <CreditCard className="w-4 h-4 text-[hsl(265_80%_65%)] shrink-0" />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Billing</p>
                  <p className="text-sm font-semibold text-foreground">Monthly</p>
                </div>
              </div>
            </div>
          )}

          {isPro && (
            <div className="relative mt-4 grid grid-cols-2 gap-2">
              {[
                'Unlimited chat messages',
                'Unlimited image generations',
                'Unlimited video generations',
                'ElevenLabs voice output',
                'Advanced creator tools',
                'Commercial image license',
              ].map(feat => (
                <div key={feat} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle className="w-3 h-3 text-[hsl(4_90%_58%)] shrink-0" />
                  {feat}
                </div>
              ))}
            </div>
          )}

          {!isPro && (
            <div className="relative mt-5 p-4 rounded-xl bg-[hsl(265_80%_65%_/_0.06)] border border-[hsl(265_80%_65%_/_0.2)]">
              <div className="flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-[hsl(265_80%_65%)] shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Upgrade to MockJ Pro</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    Unlock unlimited chat, images, videos, ElevenLabs voice, and advanced creator tools.
                  </p>
                  <button
                    onClick={() => navigate('/')}
                    className="mt-3 flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white hover:opacity-90 transition-all active:scale-95"
                    style={{ background: 'hsl(265 80% 65%)', boxShadow: '0 0 14px hsl(265 80% 65% / 0.3)' }}
                  >
                    <Crown className="w-3.5 h-3.5" />
                    See Plans
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Usage meters */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-foreground uppercase tracking-widest">Today's Usage</h2>
            {isPro && (
              <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'hsl(4 90% 58%)' }}>
                No limits · Pro
              </span>
            )}
          </div>
          <div className="space-y-2">
            {usageMetrics.map(m => <UsageMeter key={m.label} {...m} />)}
          </div>
        </div>

        {/* Manage subscription */}
        {isPro && (
          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-bold text-foreground uppercase tracking-widest">Billing</h2>
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={handleManageSubscription}
                disabled={portalLoading || !user}
                className={cn(
                  'flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-95',
                  'border text-[hsl(4_90%_58%)] hover:shadow-[0_0_16px_hsl(4_90%_58%_/_0.2)]',
                  (portalLoading || !user) && 'opacity-50 cursor-not-allowed'
                )}
                style={{
                  background: 'hsl(4 90% 58% / 0.12)',
                  borderColor: 'hsl(4 90% 58% / 0.4)',
                }}
              >
                {portalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                {portalLoading ? 'Opening portal…' : 'Manage Subscription'}
              </button>
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold border border-border text-muted-foreground hover:text-foreground hover:border-[hsl(224_15%_24%)] transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Chat
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground/60 leading-relaxed">
              The Stripe Customer Portal lets you update payment methods, view invoices, and cancel your subscription at any time.
            </p>
          </div>
        )}

        {/* Signed-out state */}
        {!user && (
          <div className="flex flex-col items-center gap-4 p-8 rounded-2xl border border-dashed border-border text-center">
            <Lock className="w-8 h-8 text-muted-foreground opacity-40" />
            <div>
              <p className="text-sm font-semibold text-foreground">Sign in to access your account</p>
              <p className="text-xs text-muted-foreground mt-1">View your plan, billing, and usage details.</p>
            </div>
            <button
              onClick={() => navigate('/auth')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all active:scale-95"
              style={{ background: 'hsl(4 90% 58%)' }}
            >
              Sign In
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
