export const BIG_DEAL_THRESHOLD = 10_000;
export const MIN_OWNER_SWEEP = 10;

export type RevenueAllocationStatus = 'READY_FOR_RTP' | 'HOLD_IN_BUSINESS_ACCOUNT';
export type RevenueAllocationTier = 'standard' | 'large_deal';

export interface RevenueAllocationInput {
  total_value: number;
  now?: Date;
}

export interface RevenueAllocationRates {
  tax: number;
  ops: number;
  owner: number;
}

export interface RevenueAllocationResult {
  tax_reserve: number;
  ops_fund: number;
  owner_sweep: number;
  total_processed: number;
  status: RevenueAllocationStatus;
  timestamp: string;
  tier: RevenueAllocationTier;
  rates: RevenueAllocationRates;
}

const STANDARD_DEAL_RATES: RevenueAllocationRates = {
  tax: 0.25,
  ops: 0.25,
  owner: 0.5,
};

const LARGE_DEAL_RATES: RevenueAllocationRates = {
  tax: 0.35,
  ops: 0.15,
  owner: 0.5,
};

function toCurrencyAmount(value: number): number {
  return Number(value.toFixed(2));
}

export function getRevenueAllocationRates(totalValue: number): {
  tier: RevenueAllocationTier;
  rates: RevenueAllocationRates;
} {
  if (totalValue > BIG_DEAL_THRESHOLD) {
    return { tier: 'large_deal', rates: LARGE_DEAL_RATES };
  }

  return { tier: 'standard', rates: STANDARD_DEAL_RATES };
}

export function allocateRevenue(input: RevenueAllocationInput): RevenueAllocationResult {
  const totalValue = input.total_value;

  if (!Number.isFinite(totalValue)) {
    throw new RangeError('total_value must be a finite number');
  }

  if (totalValue < 0) {
    throw new RangeError('total_value must be zero or greater');
  }

  const { tier, rates } = getRevenueAllocationRates(totalValue);
  const taxReserve = toCurrencyAmount(totalValue * rates.tax);
  const opsFund = toCurrencyAmount(totalValue * rates.ops);
  const ownerSweep = toCurrencyAmount(totalValue * rates.owner);

  return {
    tax_reserve: taxReserve,
    ops_fund: opsFund,
    owner_sweep: ownerSweep,
    total_processed: totalValue,
    status: ownerSweep > MIN_OWNER_SWEEP ? 'READY_FOR_RTP' : 'HOLD_IN_BUSINESS_ACCOUNT',
    timestamp: (input.now ?? new Date()).toISOString(),
    tier,
    rates,
  };
}
