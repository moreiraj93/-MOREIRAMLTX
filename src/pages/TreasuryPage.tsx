import { useMemo, useState } from 'react';
import { ArrowLeft, BadgeDollarSign, Calculator, ShieldCheck, WalletCards } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  LARGE_DEAL_THRESHOLD,
  MIN_OWNER_SWEEP,
  allocateRevenue,
} from '@/lib/revenueAllocation';

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

function formatCurrency(value: number): string {
  return currency.format(value);
}

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export default function TreasuryPage() {
  const [dealValue, setDealValue] = useState('12500');
  const numericDealValue = Number(dealValue);

  const allocation = useMemo(() => {
    if (!Number.isFinite(numericDealValue) || numericDealValue < 0) return null;
    return allocateRevenue(
      { total_value: numericDealValue },
      new Date('2026-06-09T18:00:00.000Z'),
    );
  }, [numericDealValue]);

  const isLargeDeal = allocation ? allocation.total_processed > LARGE_DEAL_THRESHOLD : false;
  const statusLabel = allocation?.status === 'READY_FOR_RTP'
    ? 'Ready for RTP mapping'
    : 'Hold in business account';

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Button asChild variant="ghost" className="text-muted-foreground hover:text-foreground">
            <Link to="/">
              <ArrowLeft className="h-4 w-4" />
              Back to MockJ
            </Link>
          </Button>
          <Badge variant="outline" className="border-[hsl(4_90%_58%_/_0.4)] px-3 py-1 text-[hsl(4_90%_58%)]">
            Treasury allocation calculator
          </Badge>
        </div>

        <section className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
          <Card className="overflow-hidden border-[hsl(4_90%_58%_/_0.25)] bg-[radial-gradient(circle_at_top_left,hsl(4_90%_58%_/_0.16),transparent_34%),hsl(224_18%_9%)]">
            <CardHeader className="space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[hsl(4_90%_58%_/_0.16)] text-[hsl(4_90%_58%)]">
                <WalletCards className="h-6 w-6" />
              </div>
              <div className="space-y-3">
                <CardTitle className="text-3xl font-black tracking-tight sm:text-5xl">
                  Revenue allocation logic is ready.
                </CardTitle>
                <CardDescription className="max-w-2xl text-base leading-7">
                  Enter a deal value to split revenue into tax reserve, operations fund,
                  and owner sweep using the tiered rules from the Make.com script.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <div>
                  <label htmlFor="deal-value" className="mb-2 block text-sm font-medium text-muted-foreground">
                    Total deal value
                  </label>
                  <Input
                    id="deal-value"
                    type="number"
                    min="0"
                    step="0.01"
                    value={dealValue}
                    onChange={(event) => setDealValue(event.target.value)}
                    className="h-12 border-[hsl(224_15%_24%)] bg-[hsl(224_20%_5%)] text-lg font-semibold"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    className="h-12 w-full bg-[hsl(4_90%_58%)] px-6 text-white hover:bg-[hsl(4_90%_52%)] sm:w-auto"
                    onClick={() => setDealValue('12000')}
                  >
                    Test $12,000
                  </Button>
                </div>
              </div>

              {!allocation && (
                <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive-foreground">
                  Enter a non-negative number to calculate the treasury split.
                </div>
              )}

              {allocation && (
                <div className="grid gap-4 sm:grid-cols-3">
                  <Card className="border-[hsl(224_15%_18%)] bg-[hsl(224_20%_6%_/_0.85)]">
                    <CardHeader className="pb-2">
                      <CardDescription>Tax reserve</CardDescription>
                      <CardTitle className="text-2xl">{formatCurrency(allocation.tax_reserve)}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                      {formatPercent(allocation.rates.taxRate)} of processed revenue
                    </CardContent>
                  </Card>
                  <Card className="border-[hsl(224_15%_18%)] bg-[hsl(224_20%_6%_/_0.85)]">
                    <CardHeader className="pb-2">
                      <CardDescription>Ops fund</CardDescription>
                      <CardTitle className="text-2xl">{formatCurrency(allocation.ops_fund)}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                      {formatPercent(allocation.rates.opsRate)} of processed revenue
                    </CardContent>
                  </Card>
                  <Card className="border-[hsl(4_90%_58%_/_0.35)] bg-[hsl(4_90%_58%_/_0.08)]">
                    <CardHeader className="pb-2">
                      <CardDescription>Owner sweep</CardDescription>
                      <CardTitle className="text-2xl">{formatCurrency(allocation.owner_sweep)}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                      {formatPercent(allocation.rates.ownerRate)} mapped to banking amount
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-6">
            <Card className="border-[hsl(224_15%_18%)] bg-card">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(265_80%_65%_/_0.14)] text-[hsl(265_80%_65%)]">
                    <Calculator className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle>Status</CardTitle>
                    <CardDescription>Current decision output</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-xl border border-[hsl(224_15%_18%)] bg-[hsl(224_20%_5%)] p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Routing status</p>
                  <p className="mt-2 text-xl font-black">{statusLabel}</p>
                  {allocation && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      Owner sweep must be greater than {formatCurrency(MIN_OWNER_SWEEP)} to move to RTP mapping.
                    </p>
                  )}
                </div>
                {allocation && (
                  <dl className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-lg bg-secondary/60 p-3">
                      <dt className="text-muted-foreground">Tier</dt>
                      <dd className="font-semibold">{isLargeDeal ? 'Over $10k' : '$10k or less'}</dd>
                    </div>
                    <div className="rounded-lg bg-secondary/60 p-3">
                      <dt className="text-muted-foreground">Processed</dt>
                      <dd className="font-semibold">{formatCurrency(allocation.total_processed)}</dd>
                    </div>
                    <div className="col-span-2 rounded-lg bg-secondary/60 p-3">
                      <dt className="text-muted-foreground">Timestamp</dt>
                      <dd className="font-mono text-xs">{allocation.timestamp}</dd>
                    </div>
                  </dl>
                )}
              </CardContent>
            </Card>

            <Card className="border-[hsl(142_70%_55%_/_0.25)] bg-[hsl(142_70%_20%_/_0.08)]">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-[hsl(142_70%_55%)]" />
                  <CardTitle className="text-lg">Safety boundary</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
                <p>
                  This screen only calculates allocations. It does not hold API keys,
                  call Mercury, call Stripe payouts, or move funds.
                </p>
                <p>
                  Use the owner_sweep value as the amount to map in a properly
                  permissioned banking workflow after compliance and approvals are configured.
                </p>
              </CardContent>
            </Card>

            <Card className="border-[hsl(224_15%_18%)] bg-card">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <BadgeDollarSign className="h-5 w-5 text-[hsl(4_90%_58%)]" />
                  <CardTitle className="text-lg">Tier rules</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>Over $10,000: 35% tax, 15% ops, 50% owner.</p>
                <p>$10,000 or less: 25% tax, 25% ops, 50% owner.</p>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </main>
  );
}
