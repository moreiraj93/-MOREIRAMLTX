export type RevenueAllocationStatus = 'READY_FOR_RTP' | 'HOLD_IN_BUSINESS_ACCOUNT';

export interface RevenueAllocationInput {
  total_value: number | string;
}

export interface RevenueAllocationResult {
  tax_reserve: number;
  ops_fund: number;
  owner_sweep: number;
  total_processed: number;
  status: RevenueAllocationStatus;
  timestamp: string;
}

const LARGE_DEAL_THRESHOLD_CENTS = 1_000_000;
const OWNER_SWEEP_READY_THRESHOLD_CENTS = 1_000;

const SMALL_DEAL_RATES = {
  taxPercent: 25,
  ownerPercent: 50,
};

const LARGE_DEAL_RATES = {
  taxPercent: 35,
  ownerPercent: 50,
};

function normalizeAmountToCents(value: RevenueAllocationInput['total_value']): number {
  const amount =
    typeof value === 'string' && value.trim() !== ''
      ? Number(value.trim())
      : typeof value === 'number'
        ? value
        : Number.NaN;

  if (!Number.isFinite(amount)) {
    throw new Error('total_value must be a finite number');
  }

  if (amount < 0) {
    throw new Error('total_value must be zero or greater');
  }

  return Math.round((amount + Number.EPSILON) * 100);
}

function centsToMoney(cents: number): number {
  return Number((cents / 100).toFixed(2));
}

function calculatePercentCents(totalCents: number, percent: number): number {
  return Math.round((totalCents * percent) / 100);
}

export function allocateRevenue(input: RevenueAllocationInput): RevenueAllocationResult {
  const totalCents = normalizeAmountToCents(input.total_value);
  const rates =
    totalCents > LARGE_DEAL_THRESHOLD_CENTS ? LARGE_DEAL_RATES : SMALL_DEAL_RATES;

  const taxReserveCents = calculatePercentCents(totalCents, rates.taxPercent);
  const ownerSweepCents = calculatePercentCents(totalCents, rates.ownerPercent);
  const opsFundCents = totalCents - taxReserveCents - ownerSweepCents;

  return {
    tax_reserve: centsToMoney(taxReserveCents),
    ops_fund: centsToMoney(opsFundCents),
    owner_sweep: centsToMoney(ownerSweepCents),
    total_processed: centsToMoney(totalCents),
    status:
      ownerSweepCents > OWNER_SWEEP_READY_THRESHOLD_CENTS
        ? 'READY_FOR_RTP'
        : 'HOLD_IN_BUSINESS_ACCOUNT',
    timestamp: new Date().toISOString(),
  };
}
