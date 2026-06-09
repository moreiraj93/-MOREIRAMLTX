import { useMemo, useState } from 'react';
import { Calculator, Landmark, ShieldCheck, Wallet } from 'lucide-react';
import { allocateRevenue, RevenueAllocationResult } from '@/lib/revenueAllocation';
import { cn } from '@/lib/utils';

const currencyFormatter = new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
});

const percentFormatter = new Intl.NumberFormat(undefined, {
  style: 'percent',
  maximumFractionDigits: 0,
});

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

function formatPercent(value: number) {
  return percentFormatter.format(value);
}

function calculateAllocation(rawValue: string): { allocation: RevenueAllocationResult | null; error: string | null } {
  if (!rawValue.trim()) {
    return { allocation: null, error: 'Enter a deal value to preview the allocation.' };
  }

  const totalValue = Number(rawValue);

  try {
    return {
      allocation: allocateRevenue({ total_value: totalValue }),
      error: null,
    };
  } catch (error) {
    return {
      allocation: null,
      error: error instanceof Error ? error.message : 'Unable to calculate this allocation.',
    };
  }
}

export default function TreasuryAllocator() {
  const [dealValue, setDealValue] = useState('12500');
  const { allocation, error } = useMemo(() => calculateAllocation(dealValue), [dealValue]);
  const isReady = allocation?.status === 'READY_FOR_RTP';

  const bags = allocation
    ? [
        {
          label: 'Tax Reserve',
          value: allocation.tax_reserve,
          rate: allocation.rates.tax,
          icon: ShieldCheck,
          color: 'hsl(142 70% 55%)',
        },
        {
          label: 'Ops Fund',
          value: allocation.ops_fund,
          rate: allocation.rates.ops,
          icon: Landmark,
          color: 'hsl(38 95% 60%)',
        },
        {
          label: 'Owner Sweep',
          value: allocation.owner_sweep,
          rate: allocation.rates.owner,
          icon: Wallet,
          color: 'hsl(265 80% 65%)',
        },
      ]
    : [];

  return (
    <section className="rounded-2xl border border-[hsl(142_70%_55%_/_0.25)] bg-[hsl(224_15%_9%)] p-5 overflow-hidden relative">
      <div
        className="absolute inset-0 pointer-events-none opacity-70"
        style={{ background: 'radial-gradient(ellipse 80% 70% at 100% 0%, hsl(142 70% 55% / 0.08), transparent 60%)' }}
      />

      <div className="relative flex flex-col gap-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center border border-[hsl(142_70%_55%_/_0.35)] bg-[hsl(142_70%_55%_/_0.1)] shrink-0">
              <Calculator className="w-5 h-5 text-[hsl(142_70%_60%)]" />
            </div>
            <div>
              <h2 className="font-bold text-foreground text-base" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Treasury Allocator
              </h2>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Preview the Make.com revenue split before mapping owner_sweep into a payout amount.
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-[hsl(38_95%_60%_/_0.35)] text-[hsl(38_95%_70%)] bg-[hsl(38_95%_60%_/_0.1)] shrink-0">
            Simulation
          </span>
        </div>

        <label className="flex flex-col gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Deal total</span>
          <div className="flex items-center rounded-xl border border-border bg-[hsl(224_15%_6%)] focus-within:border-[hsl(142_70%_55%_/_0.55)] transition-colors">
            <span className="pl-4 text-muted-foreground">$</span>
            <input
              value={dealValue}
              onChange={(event) => setDealValue(event.target.value)}
              inputMode="decimal"
              aria-label="Deal total"
              className="w-full bg-transparent px-2 py-3 text-sm text-foreground outline-none"
              placeholder="0.00"
            />
          </div>
        </label>

        {error && (
          <p className="text-xs text-[hsl(38_95%_70%)] rounded-xl border border-[hsl(38_95%_60%_/_0.25)] bg-[hsl(38_95%_60%_/_0.08)] p-3">
            {error}
          </p>
        )}

        {allocation && (
          <div className="space-y-4" aria-live="polite">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {bags.map(({ label, value, rate, icon: Icon, color }) => (
                <div key={label} className="rounded-xl border border-border bg-[hsl(224_15%_6%)] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <Icon className="w-4 h-4" style={{ color }} />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      {formatPercent(rate)}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-3">{label}</p>
                  <p className="text-base font-bold text-foreground mt-0.5">{formatCurrency(value)}</p>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-border bg-[hsl(224_15%_6%)] p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Automation output</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Tier: {allocation.tier === 'large_deal' ? 'Over $10k reserve' : 'Standard reserve'}
                  </p>
                </div>
                <span
                  className={cn(
                    'px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border',
                    isReady
                      ? 'text-[hsl(142_70%_70%)] border-[hsl(142_70%_55%_/_0.35)] bg-[hsl(142_70%_55%_/_0.1)]'
                      : 'text-[hsl(38_95%_70%)] border-[hsl(38_95%_60%_/_0.35)] bg-[hsl(38_95%_60%_/_0.1)]'
                  )}
                >
                  {allocation.status}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-black/20 p-3">
                  <span className="text-muted-foreground">owner_sweep</span>
                  <p className="font-mono text-foreground mt-1">{allocation.owner_sweep.toFixed(2)}</p>
                </div>
                <div className="rounded-lg bg-black/20 p-3">
                  <span className="text-muted-foreground">total_processed</span>
                  <p className="font-mono text-foreground mt-1">{allocation.total_processed.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground/70 leading-relaxed">
              Live money movement is not enabled here. Store fintech write keys only on the backend, keep payouts behind approval/idempotency checks, and treat this card as the calculation preview.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
