import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, Sparkles, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import logoImg from '@/assets/mockj-logo.png';

/**
 * /success — Stripe post-checkout redirect landing page.
 * 1. Refreshes subscription state from the backend
 * 2. Fires the mockj:checkout-success event so Index.tsx shows WelcomeProModal
 * 3. Redirects to / after a brief celebration moment
 */
export default function SuccessPage() {
  const { refreshSubscription } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'done'>('loading');

  useEffect(() => {
    let cancelled = false;

    async function activate() {
      // Give Stripe a moment to propagate (webhook may not have fired yet)
      await new Promise(r => setTimeout(r, 1200));
      if (cancelled) return;

      try {
        await refreshSubscription();
      } catch {
        // non-fatal — subscription will be refreshed on next poll
      }

      if (cancelled) return;
      setStatus('done');

      // Fire event so Index.tsx can open WelcomeProModal
      window.dispatchEvent(new CustomEvent('mockj:checkout-success'));

      // Brief delay so user sees the success state, then redirect
      await new Promise(r => setTimeout(r, 1800));
      if (!cancelled) navigate('/', { replace: true });
    }

    activate();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="min-h-screen bg-[hsl(224_20%_5%)] flex flex-col items-center justify-center px-4">
      {/* Radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,hsl(191_97%_55%_/_0.12)_0%,transparent_65%)] pointer-events-none" />

      <div className="relative flex flex-col items-center text-center max-w-sm">
        {/* Logo */}
        <div className="relative mb-6">
          <div
            className="w-24 h-24 rounded-2xl overflow-hidden ring-2 shadow-[0_0_48px_hsl(191_97%_55%_/_0.5)]"
            style={{ ringColor: 'hsl(191 97% 55% / 0.6)' }}
          >
            <img src={logoImg} alt="MockJ" className="w-full h-full object-cover" />
          </div>
          <div className="absolute -top-2 -right-2 w-9 h-9 rounded-full bg-[hsl(191_97%_55%)] flex items-center justify-center shadow-lg">
            <Crown className="w-5 h-5 text-[hsl(224_20%_6%)]" />
          </div>
        </div>

        {status === 'loading' ? (
          <>
            <div className="flex items-center gap-2 mb-3">
              <Loader2 className="w-4 h-4 text-[hsl(191_97%_55%)] animate-spin" />
              <span className="text-xs font-semibold uppercase tracking-widest text-[hsl(191_97%_55%)]">
                Activating your plan…
              </span>
            </div>
            <h1
              className="text-3xl font-black text-foreground mb-3"
              style={{ fontFamily: 'Space Grotesk, sans-serif' }}
            >
              Payment received!
            </h1>
            <p className="text-sm text-muted-foreground">
              Hold tight — we're confirming your subscription and getting everything ready.
            </p>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-4 h-4 text-[hsl(191_97%_55%)]" />
              <span className="text-xs font-semibold uppercase tracking-widest text-[hsl(191_97%_55%)]">
                You're all set
              </span>
              <Sparkles className="w-4 h-4 text-[hsl(191_97%_55%)]" />
            </div>
            <h1
              className="text-3xl font-black text-foreground mb-3"
              style={{ fontFamily: 'Space Grotesk, sans-serif' }}
            >
              Welcome to{' '}
              <span
                className="text-transparent bg-clip-text"
                style={{ backgroundImage: 'linear-gradient(135deg, hsl(191 97% 55%), hsl(265 80% 65%))' }}
              >
                MockJ Pro
              </span>
            </h1>
            <p className="text-sm text-muted-foreground">
              Redirecting you to your new experience…
            </p>
          </>
        )}

        {/* Animated dots */}
        <div className="flex gap-2 mt-8">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-[hsl(191_97%_55%)]"
              style={{ animation: `pulse 1.4s ease-in-out ${i * 0.2}s infinite` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
