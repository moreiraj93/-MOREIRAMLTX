export const BIG_DEAL_THRESHOLD_CENTS = 1_000_000;
export const MIN_OWNER_SWEEP_CENTS = 1_000;

export type RevenueAllocationStatus = 'READY_FOR_RTP' | 'HOLD_IN_BUSINESS_ACCOUNT';

export interface RevenueAllocationInput {
  total_value: number | string;
}

export interface RevenueAllocationOptions {
  now?: Date;
}

export interface RevenueAllocationResult {
  tax_reserve: number;
  ops_fund: number;
  owner_sweep: number;
  total_processed: number;
  status: RevenueAllocationStatus;
  timestamp: string;
}

interface AllocationTier {
  taxBasisPoints: number;
  ownerBasisPoints: number;
}

const BIG_DEAL_TIER: AllocationTier = {
  taxBasisPoints: 3_500,
  ownerBasisPoints: 5_000,
};

const STANDARD_DEAL_TIER: AllocationTier = {
  taxBasisPoints: 2_500,
  ownerBasisPoints: 5_000,
};

function normalizeToCents(value: number | string): number {
  const numericValue = typeof value === 'string' ? Number(value.trim()) : value;

  if (!Number.isFinite(numericValue)) {
    throw new Error('total_value must be a finite number.');
  }

  if (numericValue < 0) {
    throw new Error('total_value cannot be negative.');
  }

  return Math.round((numericValue + Number.EPSILON) * 100);
}

function centsToDollars(cents: number): number {
  return Number((cents / 100).toFixed(2));
}

function allocateByBasisPoints(totalCents: number, basisPoints: number): number {
  return Math.round((totalCents * basisPoints) / 10_000);
}

export function allocateRevenue(
  input: RevenueAllocationInput,
  options: RevenueAllocationOptions = {},
): RevenueAllocationResult {
  const totalCents = normalizeToCents(input.total_value);
  const tier = totalCents > BIG_DEAL_THRESHOLD_CENTS ? BIG_DEAL_TIER : STANDARD_DEAL_TIER;
  const taxReserveCents = allocateByBasisPoints(totalCents, tier.taxBasisPoints);
  const ownerSweepCents = allocateByBasisPoints(totalCents, tier.ownerBasisPoints);
  const opsFundCents = totalCents - taxReserveCents - ownerSweepCents;

  return {
    tax_reserve: centsToDollars(taxReserveCents),
    ops_fund: centsToDollars(opsFundCents),
    owner_sweep: centsToDollars(ownerSweepCents),
    total_processed: centsToDollars(totalCents),
    status: ownerSweepCents > MIN_OWNER_SWEEP_CENTS ? 'READY_FOR_RTP' : 'HOLD_IN_BUSINESS_ACCOUNT',
    timestamp: (options.now ?? new Date()).toISOString(),
  };
}
