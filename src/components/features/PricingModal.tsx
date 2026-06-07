import { createElement, useState, useEffect } from 'react';
import { Check, Crown, Zap, Loader2, RefreshCw, Settings, X, Flame } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { postAuthedApi } from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import logoImg from '@/assets/mockj-logo.png';

const STRIPE_PRO_PAYMENT_LINK = 'https://buy.stripe.com/28E3cwcSlb1fc7gb2I2B202';
const STRIPE_BUY_BUTTON_ID = 'buy_btn_1TfeyjIUjAv5Rf6LfiWoxLqK';
const STRIPE_PUBLISHABLE_KEY = 'pk_live_51TDEM6IUjAv5Rf6Ls6UgmKnj1E6cH1nUA6kmvgxWVIZ2rya2x8kXdgOaMvhqRulQP5KGqljI7caKhbv60cGsCQ3v00aGredeg0';

function buildStripeProLink(email?: string) {
  const url = new URL(STRIPE_PRO_PAYMENT_LINK);
  if (email) url.searchParams.set('prefilled_email', email);
  return url.toString();
}

// Plan definitions — update price IDs to match your Stripe dashboard
export const PLANS = {
  pro: {
    id: 'pro' as const,
    name: 'MockJ Pro',
    price: '$50.99',
    period: '/mo',
    description: 'Full access to all MockJ capabilities',
    color: 'cyan',
    icon: Crown,
    features: [
      'Unlimited AI chat with Deep Reasoning',
      'Image generation & editing (all styles)',
      'Video generation with Sora 2',
      'All personality presets',
      'Priority response speed',
      'Export & history (unlimited)',
    ],
    cta: 'Get Pro',
    badge: null,
  },
  sale: {
    id: 'sale' as const,
    name: 'MockJ Intro',
    price: '$2.99',
    period: '/mo',
    description: 'Limited-time introductory rate',
    color: 'violet',
    icon: Flame,
    features: [
      'Unlimited AI chat',
      'Image generation (standard)',
      'Video generation',
      'Personality presets',
      'Chat export',
    ],
    cta: 'Grab the Deal',
    badge: '🔥 Flash Sale',
  },
};

interface PricingModalProps {
  onClose?: () => void;
  fullPage?: boolean;
}

export default function PricingModal({ onClose, fullPage = false }: PricingModalProps) {
  const { user, subscription, refreshSubscription } = useAuth();
  const [checkingOut, setCheckingOut] = useState<'pro' | 'sale' | null>(null);
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (document.querySelector('script[src="https://js.stripe.com/v3/buy-button.js"]')) return;

    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://js.stripe.com/v3/buy-button.js';
    document.body.appendChild(script);
  }, []);

  // ?checkout=success query param kept as fallback (e.g. direct pay link redirects)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout') === 'success') {
      refreshSubscription().then(() => {
        window.dispatchEvent(new CustomEvent('mockj:checkout-success'));
      });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handleCheckout = async (plan: 'pro' | 'sale') => {
    if (!user) {
      toast.error('Please sign in first to subscribe');
      return;
    }

    setCheckingOut(plan);
    const tab = window.open('about:blank', '_blank');

    try {
      const data = await postAuthedApi<{ url?: string }>('/api/create-checkout', { plan });
      if (!data?.url) throw new Error('Checkout did not return a Stripe URL');
      if (tab) tab.location.href = data.url;
      else window.location.href = data.url;
    } catch (error) {
      if (plan === 'pro') {
        const fallbackUrl = buildStripeProLink(user.email);
        if (tab) tab.location.href = fallbackUrl;
        else window.location.href = fallbackUrl;
        setCheckingOut(null);
        return;
      }

      tab?.close();
      toast.error(error instanceof Error ? error.message : 'Failed to start checkout');
      setCheckingOut(null);
      return;
    }

    setCheckingOut(null);
  };

  const handlePortal = async () => {
    setLoadingPortal(true);
    const tab = window.open('about:blank', '_blank');
    try {
      const data = await postAuthedApi<{ url?: string }>('/api/customer-portal');
      if (!data?.url) throw new Error('Portal did not return a Stripe URL');
      if (tab) tab.location.href = data.url;
      else window.location.href = data.url;
    } catch (error) {
      tab?.close();
      toast.error(error instanceof Error ? error.message : 'Failed to open portal');
      setLoadingPortal(false);
      return;
    }
    setLoadingPortal(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshSubscription();
    toast.success('Subscription status refreshed');
    setRefreshing(false);
  };

  const wrapper = fullPage
    ? 'min-h-screen bg-background flex items-center justify-center px-4 py-12'
    : 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm';

  return (
    <div className={wrapper} onClick={!fullPage ? onClose : undefined}>
      <div
        className={cn(
          'w-full max-w-2xl',
          !fullPage && 'bg-[hsl(224_20%_7%)] border border-border rounded-2xl shadow-2xl overflow-hidden'
        )}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={cn('flex items-center justify-between px-6 py-5', !fullPage && 'border-b border-border')}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl overflow-hidden ring-1 ring-[hsl(191_97%_55%_/_0.4)]">
              <img src={logoImg} alt="MockJ" className="w-full h-full object-cover" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-foreground" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                MockJ Plans
              </h2>
              <p className="text-xs text-muted-foreground">Unlock the full experience</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className="w-8 h-8 rounded-lg flex items-center justify-center border border-border text-muted-foreground hover:text-foreground transition-all"
              title="Refresh subscription status"
            >
              <RefreshCw className={cn('w-3.5 h-3.5', refreshing && 'animate-spin')} />
            </button>
            {!fullPage && onClose && (
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center border border-border text-muted-foreground hover:text-foreground transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Active subscription banner */}
        {subscription.subscribed && (
          <div className="mx-6 mt-5 p-4 rounded-xl bg-[hsl(191_97%_55%_/_0.08)] border border-[hsl(191_97%_55%_/_0.3)]">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Crown className="w-4 h-4 text-[hsl(191_97%_55%)]" />
                  <span className="text-sm font-semibold text-[hsl(191_97%_55%)]">
                    Active: MockJ {subscription.tier === 'sale' ? 'Intro' : 'Pro'}
                  </span>
                </div>
                {subscription.subscriptionEnd && (
                  <p className="text-xs text-muted-foreground">
                    Renews {new Date(subscription.subscriptionEnd).toLocaleDateString()}
                  </p>
                )}
              </div>
              <button
                onClick={handlePortal}
                disabled={loadingPortal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[hsl(191_97%_55%_/_0.4)] text-[hsl(191_97%_55%)] text-xs font-medium hover:bg-[hsl(191_97%_55%_/_0.1)] transition-all disabled:opacity-60"
              >
                {loadingPortal ? <Loader2 className="w-3 h-3 animate-spin" /> : <Settings className="w-3 h-3" />}
                Manage
              </button>
            </div>
          </div>
        )}

        {/* Plans Grid */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(Object.values(PLANS) as typeof PLANS[keyof typeof PLANS][]).map(plan => {
            const Icon = plan.icon;
            const isCyan = plan.color === 'cyan';
            const accentColor = isCyan ? 'hsl(191 97% 55%)' : 'hsl(265 80% 65%)';
            const accentBg = isCyan ? 'hsl(191 97% 55% / 0.08)' : 'hsl(265 80% 65% / 0.08)';
            const accentBorder = isCyan ? 'hsl(191 97% 55% / 0.35)' : 'hsl(265 80% 65% / 0.35)';
            const isActive = subscription.subscribed && subscription.tier === plan.id;
            const isLoading = checkingOut === plan.id;

            return (
              <div
                key={plan.id}
                className={cn(
                  'relative rounded-2xl border p-5 flex flex-col gap-4 transition-all duration-200',
                  isActive
                    ? 'shadow-lg'
                    : 'hover:shadow-md'
                )}
                style={{
                  borderColor: isActive ? accentBorder : 'hsl(224 15% 18%)',
                  backgroundColor: isActive ? accentBg : 'hsl(224 15% 9%)',
                }}
              >
                {/* Badge */}
                {plan.badge && (
                  <div
                    className="absolute -top-2.5 left-4 px-2.5 py-0.5 rounded-full text-[10px] font-bold"
                    style={{ backgroundColor: accentColor, color: 'hsl(224 20% 6%)' }}
                  >
                    {plan.badge}
                  </div>
                )}
                {isActive && (
                  <div
                    className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full text-[10px] font-bold"
                    style={{ backgroundColor: accentColor, color: 'hsl(224 20% 6%)' }}
                  >
                    Your Plan ✓
                  </div>
                )}

                {/* Plan Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="w-4 h-4" style={{ color: accentColor }} />
                      <span className="text-sm font-bold text-foreground">{plan.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{plan.description}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold" style={{ color: accentColor }}>{plan.price}</span>
                    <span className="text-xs text-muted-foreground">{plan.period}</span>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-2 flex-1">
                  {plan.features.map(feat => (
                    <li key={feat} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <Check className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: accentColor }} />
                      {feat}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                {isActive ? (
                  <button
                    onClick={handlePortal}
                    disabled={loadingPortal}
                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-200 disabled:opacity-60"
                    style={{ borderColor: accentBorder, color: accentColor, backgroundColor: accentBg }}
                  >
                    {loadingPortal ? <Loader2 className="w-4 h-4 animate-spin" /> : <Settings className="w-4 h-4" />}
                    Manage Plan
                  </button>
                ) : (
                  <div className="flex flex-col gap-2">
                    {plan.id === 'pro' && (
                      <div className="overflow-hidden rounded-xl">
                        {createElement('stripe-buy-button', {
                          'buy-button-id': STRIPE_BUY_BUTTON_ID,
                          'publishable-key': STRIPE_PUBLISHABLE_KEY,
                        })}
                      </div>
                    )}
                    <button
                      onClick={() => handleCheckout(plan.id)}
                      disabled={!!checkingOut || subscription.subscribed}
                      className={cn(
                        'flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed'
                      )}
                      style={{
                        backgroundColor: accentColor,
                        color: 'hsl(224 20% 6%)',
                      }}
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Zap className="w-4 h-4" />
                          {plan.cta}
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5">
          <p className="text-[11px] text-muted-foreground/50 text-center">
            Secured by Stripe · Cancel any time from your subscription portal
          </p>
        </div>
      </div>
    </div>
  );
}
