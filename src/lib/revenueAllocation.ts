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

interface AllocationTier {
  taxBasisPoints: number;
  opsBasisPoints: number;
  ownerBasisPoints: number;
}

interface AllocationOptions {
  now?: Date;
}

const BIG_DEAL_THRESHOLD_CENTS = 1_000_000;
const OWNER_SWEEP_THRESHOLD_CENTS = 1_000;
const BASIS_POINTS_DIVISOR = 10_000;

const SMALL_DEAL_TIER: AllocationTier = {
  taxBasisPoints: 2_500,
  opsBasisPoints: 2_500,
  ownerBasisPoints: 5_000,
};

const BIG_DEAL_TIER: AllocationTier = {
  taxBasisPoints: 3_500,
  opsBasisPoints: 1_500,
  ownerBasisPoints: 5_000,
};

function normalizeMoneyToCents(value: number | string): number {
  const parsed = typeof value === 'number' ? value : Number(value);

  if (!Number.isFinite(parsed)) {
    throw new Error('total_value must be a finite number');
  }

  if (parsed < 0) {
    throw new Error('total_value must be greater than or equal to 0');
  }

  return Math.round(parsed * 100);
}

function centsToDollars(cents: number): number {
  return cents / 100;
}

function calculateBasisPointShare(totalCents: number, basisPoints: number): number {
  return Math.round((totalCents * basisPoints) / BASIS_POINTS_DIVISOR);
}

function allocationTierFor(totalCents: number): AllocationTier {
  return totalCents > BIG_DEAL_THRESHOLD_CENTS ? BIG_DEAL_TIER : SMALL_DEAL_TIER;
}

export function allocateRevenue(
  input: RevenueAllocationInput,
  options: AllocationOptions = {},
): RevenueAllocationResult {
  const totalCents = normalizeMoneyToCents(input.total_value);
  const tier = allocationTierFor(totalCents);

  const taxReserveCents = calculateBasisPointShare(totalCents, tier.taxBasisPoints);
  const ownerSweepCents = calculateBasisPointShare(totalCents, tier.ownerBasisPoints);
  const opsFundCents = totalCents - taxReserveCents - ownerSweepCents;

  return {
    tax_reserve: centsToDollars(taxReserveCents),
    ops_fund: centsToDollars(opsFundCents),
    owner_sweep: centsToDollars(ownerSweepCents),
    total_processed: centsToDollars(totalCents),
    status: ownerSweepCents > OWNER_SWEEP_THRESHOLD_CENTS ? 'READY_FOR_RTP' : 'HOLD_IN_BUSINESS_ACCOUNT',
    timestamp: (options.now ?? new Date()).toISOString(),
  };
}
