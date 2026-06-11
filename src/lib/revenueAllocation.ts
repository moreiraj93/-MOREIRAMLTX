const CENTS_PER_DOLLAR = 100;
const LARGE_DEAL_THRESHOLD_CENTS = 10_000 * CENTS_PER_DOLLAR;
const OWNER_SWEEP_MINIMUM_CENTS = 10 * CENTS_PER_DOLLAR;

export type RevenueAllocationStatus =
  | 'READY_FOR_RTP'
  | 'HOLD_IN_BUSINESS_ACCOUNT';

export interface RevenueAllocationInput {
  total_value: number | string;
}

export interface RevenueAllocationRates {
  taxRate: number;
  opsRate: number;
  ownerRate: number;
}

export interface RevenueAllocationResult {
  tax_reserve: number;
  ops_fund: number;
  owner_sweep: number;
  total_processed: number;
  status: RevenueAllocationStatus;
  timestamp: string;
}

export interface RevenueAllocationOptions {
  now?: Date;
}

export const STANDARD_DEAL_RATES: RevenueAllocationRates = {
  taxRate: 0.25,
  opsRate: 0.25,
  ownerRate: 0.5,
};

export const LARGE_DEAL_RATES: RevenueAllocationRates = {
  taxRate: 0.35,
  opsRate: 0.15,
  ownerRate: 0.5,
};

function toCents(value: number | string): number {
  const parsedValue = typeof value === 'string' ? Number(value.trim()) : value;

  if (!Number.isFinite(parsedValue)) {
    throw new TypeError('total_value must be a finite number');
  }

  if (parsedValue < 0) {
    throw new RangeError('total_value cannot be negative');
  }

  return Math.round(parsedValue * CENTS_PER_DOLLAR);
}

function toDollars(cents: number): number {
  return cents / CENTS_PER_DOLLAR;
}

export function getRevenueAllocationRates(
  totalValue: number | string,
): RevenueAllocationRates {
  const totalCents = toCents(totalValue);
  return totalCents > LARGE_DEAL_THRESHOLD_CENTS
    ? LARGE_DEAL_RATES
    : STANDARD_DEAL_RATES;
}

export function allocateRevenue(
  input: RevenueAllocationInput,
  options: RevenueAllocationOptions = {},
): RevenueAllocationResult {
  const totalCents = toCents(input.total_value);
  const rates =
    totalCents > LARGE_DEAL_THRESHOLD_CENTS
      ? LARGE_DEAL_RATES
      : STANDARD_DEAL_RATES;

  const taxReserveCents = Math.round(totalCents * rates.taxRate);
  const ownerSweepCents = Math.round(totalCents * rates.ownerRate);
  const opsFundCents = totalCents - taxReserveCents - ownerSweepCents;

  return {
    tax_reserve: toDollars(taxReserveCents),
    ops_fund: toDollars(opsFundCents),
    owner_sweep: toDollars(ownerSweepCents),
    total_processed: toDollars(totalCents),
    status:
      ownerSweepCents > OWNER_SWEEP_MINIMUM_CENTS
        ? 'READY_FOR_RTP'
        : 'HOLD_IN_BUSINESS_ACCOUNT',
    timestamp: (options.now ?? new Date()).toISOString(),
  };
}

export const calculateRevenueAllocation = allocateRevenue;
