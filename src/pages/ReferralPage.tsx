import { useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, Coins, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  normalizeReferralCode,
  storePendingReferralCode,
  useTokenWallet,
} from '@/hooks/useTokenWallet';
import { toast } from 'sonner';

function safeReferralPath(code: string) {
  return `/ref/${encodeURIComponent(code)}`;
}

export default function ReferralPage() {
  const { code: rawCode = '' } = useParams();
  const code = normalizeReferralCode(rawCode);
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { applyReferralCode, referralBonus } = useTokenWallet();
  const appliedRef = useRef(false);

  useEffect(() => {
    if (code) storePendingReferralCode(code);
  }, [code]);

  useEffect(() => {
    if (loading || !user || !code || appliedRef.current) return;

    appliedRef.current = true;
    const result = applyReferralCode(code);
    if (result.ok) {
      toast.success(result.message);
    } else {
      toast.message(result.message);
    }
    navigate('/tokens?tab=referral', { replace: true });
  }, [applyReferralCode, code, loading, navigate, user]);

  const goToAuth = (mode: 'login' | 'signup') => {
    if (code) storePendingReferralCode(code);
    const redirect = encodeURIComponent(safeReferralPath(code));
    navigate(`/auth?mode=${mode}&redirect=${redirect}`);
  };

  return (
    <div className="min-h-screen bg-background px-4 py-10 text-foreground">
      <main className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center">
        <div className="rounded-2xl border border-[hsl(265_80%_65%_/_0.36)] bg-[hsl(224_15%_8%)] p-6 shadow-[0_0_36px_hsl(265_80%_65%_/_0.08)]">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[hsl(265_80%_65%_/_0.34)] bg-[hsl(265_80%_65%_/_0.12)]">
            <Users className="h-5 w-5 text-[hsl(265_80%_75%)]" />
          </div>
          <h1 className="mt-5 text-2xl font-black" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Claim your MockJ referral bonus
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Apply code <span className="font-black text-foreground">{code || 'UNKNOWN'}</span> and get{' '}
            {referralBonus.toLocaleString()} MLTX tokens after signing in.
          </p>

          <div className="mt-5 rounded-xl border border-border bg-[hsl(224_15%_10%)] p-4">
            <div className="flex items-center gap-3">
              <Coins className="h-5 w-5 text-[hsl(38_95%_60%)]" />
              <div>
                <p className="text-sm font-black text-foreground">Referral code saved</p>
                <p className="text-xs text-muted-foreground">It will be applied to this account after sign in.</p>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => goToAuth('signup')}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[hsl(265_80%_65%)] px-4 py-3 text-sm font-black text-white transition hover:bg-[hsl(265_80%_70%)]"
            >
              Create Account
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => goToAuth('login')}
              className="rounded-xl border border-border px-4 py-3 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
            >
              Sign In
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
