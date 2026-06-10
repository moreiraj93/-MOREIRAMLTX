import { useEffect, useState } from 'react';
import { Crown, Zap, Sparkles, Calendar, CheckCircle2, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import logoImg from '@/assets/mockj-logo.png';
import { cn } from '@/lib/utils';

interface WelcomeProModalProps {
  onClose: () => void;
}

export default function WelcomeProModal({ onClose }: WelcomeProModalProps) {
  const { subscription } = useAuth();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Animate in
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  const tierLabel = subscription.tier === 'sale' ? 'Intro' : 'Pro';
  const renewDate = subscription.subscriptionEnd
    ? new Date(subscription.subscriptionEnd).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  const perks = [
    'Unlimited AI chat with Deep Reasoning',
    'Image generation & editing (all styles)',
    'MLTXPRO video generation',
    'All personality presets unlocked',
    'Priority response speed',
  ];

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300',
        visible ? 'bg-black/75 backdrop-blur-sm' : 'bg-transparent'
      )}
      onClick={handleClose}
    >
      <div
        className={cn(
          'w-full max-w-md relative transition-all duration-300',
          visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        )}
        onClick={e => e.stopPropagation()}
      >
        {/* Glow rings */}
        <div className="absolute inset-0 rounded-3xl bg-[hsl(191_97%_55%_/_0.12)] blur-2xl scale-110 pointer-events-none" />
        <div className="absolute inset-0 rounded-3xl bg-[hsl(265_80%_65%_/_0.07)] blur-3xl scale-125 pointer-events-none" />

        <div className="relative bg-[hsl(224_20%_7%)] border border-[hsl(191_97%_55%_/_0.35)] rounded-3xl overflow-hidden shadow-2xl">
          {/* Close */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-[hsl(224_15%_14%)] text-muted-foreground hover:text-foreground transition-all hover:bg-[hsl(224_15%_20%)]"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Hero */}
          <div className="relative px-6 pt-8 pb-6 flex flex-col items-center text-center overflow-hidden">
            {/* Radial glow background */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,hsl(191_97%_55%_/_0.18)_0%,transparent_70%)] pointer-events-none" />

            {/* Animated logo */}
            <div className="relative mb-4">
              <div className="w-20 h-20 rounded-2xl overflow-hidden ring-2 ring-[hsl(191_97%_55%_/_0.6)] shadow-[0_0_32px_hsl(191_97%_55%_/_0.5)]">
                <img src={logoImg} alt="MockJ" className="w-full h-full object-cover" />
              </div>
              {/* Crown badge */}
              <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-[hsl(191_97%_55%)] flex items-center justify-center shadow-lg">
                <Crown className="w-4 h-4 text-[hsl(224_20%_6%)]" />
              </div>
            </div>

            {/* Headline */}
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-[hsl(191_97%_55%)]" />
              <span className="text-xs font-bold uppercase tracking-widest text-[hsl(191_97%_55%)]">
                Welcome to
              </span>
              <Sparkles className="w-4 h-4 text-[hsl(191_97%_55%)]" />
            </div>
            <h1
              className="text-3xl font-black text-foreground mb-2"
              style={{ fontFamily: 'Space Grotesk, sans-serif' }}
            >
              MockJ{' '}
              <span
                className="text-transparent bg-clip-text"
                style={{ backgroundImage: 'linear-gradient(135deg, hsl(191 97% 55%), hsl(265 80% 65%))' }}
              >
                {tierLabel}
              </span>
            </h1>
            <p className="text-sm text-muted-foreground max-w-xs">
              You're now running the full build. Unlimited AI, image & video generation — zero holds barred.
            </p>
          </div>

          {/* Subscription details */}
          {renewDate && (
            <div className="mx-6 mb-4 flex items-center gap-3 px-4 py-3 rounded-xl bg-[hsl(224_15%_10%)] border border-[hsl(191_97%_55%_/_0.2)]">
              <Calendar className="w-4 h-4 text-[hsl(191_97%_55%)] shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Next renewal</p>
                <p className="text-sm font-semibold text-foreground">{renewDate}</p>
              </div>
              <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[hsl(191_97%_55%_/_0.15)] border border-[hsl(191_97%_55%_/_0.3)]">
                <div className="w-1.5 h-1.5 rounded-full bg-[hsl(191_97%_55%)] animate-pulse" />
                <span className="text-[10px] font-bold text-[hsl(191_97%_55%)]">ACTIVE</span>
              </div>
            </div>
          )}

          {/* Perks list */}
          <div className="mx-6 mb-6 space-y-2">
            {perks.map(perk => (
              <div key={perk} className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-[hsl(191_97%_55%)] shrink-0" />
                <span className="text-sm text-muted-foreground">{perk}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="px-6 pb-6">
            <button
              onClick={handleClose}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all duration-200 active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, hsl(191 97% 55%), hsl(265 80% 65%))',
                color: 'hsl(224 20% 6%)',
              }}
            >
              <Zap className="w-4 h-4" />
              Let's go — start chatting
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
