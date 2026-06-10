import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Coins,
  Copy,
  Gift,
  History,
  Image as ImageIcon,
  Lock,
  MessageCircle,
  Mic,
  RefreshCw,
  Share2,
  ShoppingBag,
  Users,
  Video,
  Zap,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  consumePendingReferralCode,
  TOKEN_COST_CATALOG,
  TokenCatalogId,
  TokenCatalogItem,
  useTokenWallet,
} from '@/hooks/useTokenWallet';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type TokenTab = 'overview' | 'shop' | 'earn' | 'referral' | 'history';

const TABS: { id: TokenTab; label: string; icon: typeof Coins }[] = [
  { id: 'overview', label: 'Overview', icon: Coins },
  { id: 'shop', label: 'Shop', icon: Zap },
  { id: 'earn', label: 'Earn', icon: Gift },
  { id: 'referral', label: 'Referral', icon: Users },
  { id: 'history', label: 'History', icon: History },
];

const CATEGORY_ICONS: Record<TokenCatalogItem['category'], typeof MessageCircle> = {
  chat: MessageCircle,
  image: ImageIcon,
  video: Video,
  voice: Mic,
};

const CATEGORY_TONE: Record<TokenCatalogItem['category'], string> = {
  chat: 'text-[hsl(265_80%_75%)] bg-[hsl(265_80%_65%_/_0.12)] border-[hsl(265_80%_65%_/_0.28)]',
  image: 'text-[hsl(142_70%_60%)] bg-[hsl(142_70%_50%_/_0.12)] border-[hsl(142_70%_50%_/_0.28)]',
  video: 'text-[hsl(210_100%_72%)] bg-[hsl(210_100%_62%_/_0.12)] border-[hsl(210_100%_62%_/_0.28)]',
  voice: 'text-[hsl(38_95%_65%)] bg-[hsl(38_95%_60%_/_0.12)] border-[hsl(38_95%_60%_/_0.28)]',
};

export default function TokensPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading } = useAuth();
  const {
    tokenBalance,
    starterBalance,
    canSpendCatalogItem,
    spendCatalogItem,
    referralStats,
    referralBonus,
    applyReferralCode,
  } = useTokenWallet();
  const requestedTab = searchParams.get('tab') as TokenTab | null;
  const [activeTab, setActiveTab] = useState<TokenTab>(
    TABS.some(tab => tab.id === requestedTab) ? requestedTab : 'overview'
  );
  const [selectedId, setSelectedId] = useState<TokenCatalogId>('chat-basic');
  const [referralInput, setReferralInput] = useState('');
  const [copiedReferral, setCopiedReferral] = useState(false);

  const selected = useMemo(
    () => TOKEN_COST_CATALOG.find(item => item.id === selectedId) ?? TOKEN_COST_CATALOG[0],
    [selectedId]
  );

  const requireAccount = () => {
    toast.message('Create a free MockJ account to unlock and spend MLTX tokens.');
    navigate('/auth?mode=signup');
  };

  useEffect(() => {
    if (TABS.some(tab => tab.id === requestedTab)) {
      setActiveTab(requestedTab);
    }
  }, [requestedTab]);

  useEffect(() => {
    if (!user) return;
    const pendingReferralCode = consumePendingReferralCode();
    if (!pendingReferralCode) return;

    setActiveTab('referral');
    const result = applyReferralCode(pendingReferralCode);
    if (result.ok) {
      toast.success(result.message);
    } else {
      toast.message(result.message);
    }
  }, [applyReferralCode, user]);

  const handleCostClick = (item: TokenCatalogItem) => {
    setSelectedId(item.id);
    if (!user) {
      requireAccount();
      return;
    }
    toast.success(`${item.label} selected`);
  };

  const handleUseSelected = () => {
    if (!user) {
      requireAccount();
      return;
    }

    if (!canSpendCatalogItem(selected.id)) {
      toast.error(`Not enough MLTX tokens. ${selected.cost} needed for ${selected.shortLabel}.`);
      return;
    }

    if (spendCatalogItem(selected.id)) {
      toast.success(`${selected.cost} MLTX tokens used for ${selected.shortLabel}.`);
    }
  };

  const handleCopyReferral = async () => {
    if (!user || !referralStats) {
      requireAccount();
      return;
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(referralStats.link);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = referralStats.link;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedReferral(true);
      toast.success('Referral link copied.');
      window.setTimeout(() => setCopiedReferral(false), 1800);
    } catch {
      toast.error('Copy failed. Select the link and copy it manually.');
    }
  };

  const handleApplyReferral = (event: FormEvent) => {
    event.preventDefault();
    if (!user) {
      requireAccount();
      return;
    }

    const result = applyReferralCode(referralInput);
    if (result.ok) {
      setReferralInput('');
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-[hsl(224_20%_5%_/_0.94)] backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-3">
          <button
            onClick={() => navigate('/')}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:text-foreground"
            title="Back to MockJ"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[hsl(38_95%_60%_/_0.38)] bg-[hsl(38_95%_60%_/_0.12)]">
            <Coins className="h-4 w-4 text-[hsl(38_95%_60%)]" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-black text-foreground" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              MOCKJ Tokens
            </h1>
            <p className="text-[10px] text-muted-foreground">MLTXPRO in-app currency</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => window.location.reload()}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:text-foreground"
              title="Refresh"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(38_95%_60%_/_0.45)] bg-[hsl(38_95%_60%_/_0.1)] px-3 py-1.5 text-xs font-bold text-[hsl(38_95%_60%)]">
              <Coins className="h-3.5 w-3.5" />
              {tokenBalance.toLocaleString()}
            </div>
          </div>
        </div>

        <nav className="mx-auto flex max-w-4xl gap-1 overflow-x-auto px-4">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                'flex items-center gap-1.5 border-b-2 px-3 py-2 text-[11px] font-semibold transition',
                activeTab === id
                  ? 'border-[hsl(38_95%_60%)] text-[hsl(38_95%_60%)]'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-4xl space-y-5 px-4 py-6">
        <section className="rounded-2xl border border-[hsl(38_95%_60%_/_0.28)] bg-[linear-gradient(145deg,hsl(38_95%_60%_/_0.10),hsl(224_20%_7%)_44%,hsl(224_15%_9%))] p-5 shadow-[0_0_36px_hsl(38_95%_60%_/_0.08)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Token Balance</p>
              <div className="mt-2 flex items-end gap-2">
                <span className="text-4xl font-black text-[hsl(38_95%_60%)]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {tokenBalance.toLocaleString()}
                </span>
                <span className="pb-1 text-sm font-bold text-muted-foreground">MLTX</span>
              </div>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[hsl(38_95%_60%_/_0.34)] bg-[hsl(38_95%_60%_/_0.12)]">
              {user ? <CheckCircle2 className="h-5 w-5 text-[hsl(142_70%_55%)]" /> : <Lock className="h-5 w-5 text-[hsl(38_95%_60%)]" />}
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-black/16 px-4 py-3">
              <p className="text-[10px] text-muted-foreground">Lifetime Earned</p>
              <p className="mt-1 text-sm font-bold text-[hsl(142_70%_55%)]">{user ? starterBalance.toLocaleString() : 0}</p>
            </div>
            <div className="rounded-xl border border-border bg-black/16 px-4 py-3">
              <p className="text-[10px] text-muted-foreground">Lifetime Spent</p>
              <p className="mt-1 text-sm font-bold text-[hsl(4_90%_64%)]">{user ? (starterBalance - tokenBalance).toLocaleString() : 0}</p>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between gap-3">
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Token Costs</h2>
            {!user && !loading && (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-[hsl(38_95%_60%)]">
                <Lock className="h-3 w-3" />
                Sign in required
              </span>
            )}
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {TOKEN_COST_CATALOG.map(item => {
              const Icon = CATEGORY_ICONS[item.category];
              const selectedCost = selected.id === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleCostClick(item)}
                  className={cn(
                    'flex items-center gap-3 rounded-xl border bg-[hsl(224_15%_9%)] px-3 py-2.5 text-left transition hover:-translate-y-0.5 hover:border-[hsl(38_95%_60%_/_0.5)] focus:outline-none focus:ring-2 focus:ring-[hsl(38_95%_60%_/_0.45)]',
                    selectedCost ? 'border-[hsl(38_95%_60%_/_0.65)] shadow-[0_0_22px_hsl(38_95%_60%_/_0.08)]' : 'border-border'
                  )}
                >
                  <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border', CATEGORY_TONE[item.category])}>
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-semibold text-foreground">{item.label}</span>
                    <span className="block truncate text-[10px] text-muted-foreground">{item.description}</span>
                  </span>
                  <span className="text-xs font-black text-[hsl(38_95%_60%)]">{item.cost}</span>
                </button>
              );
            })}
          </div>
        </section>

        {activeTab === 'referral' && (
          <section className="space-y-4">
            <div className="rounded-2xl border border-[hsl(265_80%_65%_/_0.36)] bg-[hsl(265_80%_65%_/_0.08)] p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[hsl(265_80%_65%_/_0.34)] bg-[hsl(265_80%_65%_/_0.12)]">
                  <Users className="h-4 w-4 text-[hsl(265_80%_75%)]" />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-sm font-black text-foreground">Your Referral Link</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Share and earn {referralBonus.toLocaleString()} MLTX tokens when a new account applies your code.
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <a
                  href={referralStats?.link ?? '#'}
                  onClick={event => {
                    if (!user) {
                      event.preventDefault();
                      requireAccount();
                    }
                  }}
                  className="flex-1 rounded-xl border border-border bg-[hsl(224_15%_8%)] px-3 py-2 text-xs font-semibold text-foreground transition hover:border-[hsl(265_80%_65%_/_0.45)] focus:outline-none focus:ring-2 focus:ring-[hsl(265_80%_65%_/_0.35)]"
                >
                  <span className="block break-all">
                    {user && referralStats ? referralStats.link : 'Create an account to generate your referral link'}
                  </span>
                </a>
                <button
                  type="button"
                  onClick={handleCopyReferral}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[hsl(265_80%_65%)] px-4 py-2 text-xs font-black text-white transition hover:bg-[hsl(265_80%_70%)]"
                >
                  <Copy className="h-3.5 w-3.5" />
                  {copiedReferral ? 'Copied' : 'Copy'}
                </button>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                <div className="rounded-xl border border-border bg-[hsl(224_15%_8%)] p-3 text-center">
                  <p className="text-lg font-black text-[hsl(265_80%_75%)]">{referralStats?.totalReferrals ?? 0}</p>
                  <p className="text-[10px] text-muted-foreground">Total Referrals</p>
                </div>
                <div className="rounded-xl border border-border bg-[hsl(224_15%_8%)] p-3 text-center">
                  <p className="text-lg font-black text-[hsl(38_95%_60%)]">{referralStats?.tokensEarned ?? 0}</p>
                  <p className="text-[10px] text-muted-foreground">Tokens Earned</p>
                </div>
                <div className="rounded-xl border border-border bg-[hsl(224_15%_8%)] p-3 text-center">
                  <p className="text-lg font-black text-[hsl(142_70%_55%)]">{referralStats?.untilVip ?? 25}</p>
                  <p className="text-[10px] text-muted-foreground">Until VIP</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleApplyReferral} className="rounded-2xl border border-border bg-[hsl(224_15%_8%)] p-4">
              <h2 className="text-sm font-black text-foreground">Apply a Referral Code</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Enter a friend's code or paste their full referral link to get {referralBonus.toLocaleString()} bonus MLTX tokens.
              </p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  value={referralInput}
                  onChange={event => setReferralInput(event.target.value)}
                  placeholder="Enter referral code or link..."
                  className="min-h-11 flex-1 rounded-xl border border-border bg-[hsl(224_15%_10%)] px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-[hsl(265_80%_65%_/_0.55)]"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-[hsl(265_80%_65%)] px-5 py-2.5 text-sm font-black text-white transition hover:bg-[hsl(265_80%_70%)]"
                >
                  Apply
                </button>
              </div>
              {referralStats?.appliedCode && (
                <p className="mt-3 text-xs font-semibold text-[hsl(142_70%_55%)]">
                  Applied code: {referralStats.appliedCode}
                </p>
              )}
            </form>

            <div className="rounded-2xl border border-border bg-[hsl(224_15%_8%)] p-4">
              <h2 className="text-sm font-black text-foreground">Referral Rewards</h2>
              <div className="mt-3 divide-y divide-border">
                {[
                  ['Friend signs up', `+${referralBonus.toLocaleString()} tokens each`],
                  ['Friend applies your code', `+${referralBonus.toLocaleString()} tokens for them`],
                  ['25 referrals', 'VIP Ambassador rate unlocked'],
                ].map(([label, reward]) => (
                  <div key={label} className="flex items-center justify-between gap-3 py-3 text-xs">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="text-right font-black text-[hsl(265_80%_75%)]">{reward}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {activeTab !== 'overview' && activeTab !== 'referral' && (
          <section className="rounded-2xl border border-border bg-[hsl(224_15%_8%)] p-4">
            <div className="flex items-start gap-3">
              <ShoppingBag className="mt-0.5 h-4 w-4 text-[hsl(38_95%_60%)]" />
              <div>
                <p className="text-sm font-bold text-foreground">{TABS.find(tab => tab.id === activeTab)?.label}</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {user
                    ? 'This section is wired as an authenticated token surface. Pick an individual cost box to choose what to spend on.'
                    : 'Create a free account before earning, spending, referring, or viewing token history.'}
                </p>
              </div>
            </div>
          </section>
        )}

        <section className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <button
            type="button"
            onClick={() => user ? toast.success('Daily streak checked. Come back tomorrow.') : requireAccount()}
            className="flex items-center justify-between rounded-2xl border border-border bg-[hsl(224_15%_8%)] p-4 text-left transition hover:border-[hsl(38_95%_60%_/_0.42)]"
          >
            <span className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[hsl(38_95%_60%_/_0.34)] bg-[hsl(38_95%_60%_/_0.1)]">
                <Clock className="h-4 w-4 text-[hsl(38_95%_60%)]" />
              </span>
              <span>
                <span className="block text-sm font-bold text-foreground">Daily Streak</span>
                <span className="block text-xs text-muted-foreground">Day 0 - Come back tomorrow</span>
              </span>
            </span>
            <ArrowLeft className="h-4 w-4 rotate-180 text-muted-foreground" />
          </button>

          <div className="rounded-2xl border border-border bg-[hsl(224_15%_8%)] p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Selected</p>
            <p className="mt-2 text-sm font-black text-foreground">{selected.label}</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">{selected.description}</p>
            <button
              type="button"
              onClick={handleUseSelected}
              disabled={user ? !canSpendCatalogItem(selected.id) : false}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[hsl(38_95%_60%)] px-4 py-2.5 text-sm font-black text-[hsl(224_20%_6%)] transition hover:bg-[hsl(38_95%_68%)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {user ? <Coins className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
              {user ? `Use ${selected.cost} tokens` : 'Create Free Account'}
            </button>
          </div>
        </section>

        {!user && !loading && (
          <section className="rounded-2xl border border-dashed border-[hsl(38_95%_60%_/_0.48)] bg-[hsl(38_95%_60%_/_0.04)] p-6 text-center">
            <Coins className="mx-auto h-7 w-7 text-[hsl(38_95%_60%)]" />
            <h2 className="mt-3 text-sm font-black text-foreground">Sign in to earn tokens</h2>
            <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
              Get {starterBalance.toLocaleString()} free MLTX tokens after creating an account. Guests cannot spend or earn tokens.
            </p>
            <div className="mt-4 flex flex-col items-center justify-center gap-2 sm:flex-row">
              <button
                type="button"
                onClick={requireAccount}
                className="rounded-xl bg-[hsl(38_95%_60%)] px-5 py-2.5 text-sm font-black text-[hsl(224_20%_6%)] transition hover:bg-[hsl(38_95%_68%)]"
              >
                Create Free Account
              </button>
              <button
                type="button"
                onClick={() => navigate('/auth')}
                className="inline-flex items-center gap-2 rounded-xl border border-border px-5 py-2.5 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
              >
                <Share2 className="h-4 w-4" />
                Sign In
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
