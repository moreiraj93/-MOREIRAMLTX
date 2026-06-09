export type RevenueAllocationStatus = 'READY_FOR_RTP' | 'HOLD_IN_BUSINESS_ACCOUNT';

export interface RevenueAllocationInput {
  total_value: number;
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
  rates: RevenueAllocationRates;
}

export const LARGE_DEAL_THRESHOLD = 10000;
export const MIN_OWNER_SWEEP = 10;

const SMALL_DEAL_RATES: RevenueAllocationRates = {
  taxRate: 0.25,
  opsRate: 0.25,
  ownerRate: 0.5,
};

const LARGE_DEAL_RATES: RevenueAllocationRates = {
  taxRate: 0.35,
  opsRate: 0.15,
  ownerRate: 0.5,
};

function roundToCents(value: number): number {
  return Number((Math.round((value + Number.EPSILON) * 100) / 100).toFixed(2));
}

export function ratesForTotalValue(totalValue: number): RevenueAllocationRates {
  return totalValue > LARGE_DEAL_THRESHOLD ? LARGE_DEAL_RATES : SMALL_DEAL_RATES;
}

export function allocateRevenue(
  input: RevenueAllocationInput,
  timestamp: Date = new Date(),
): RevenueAllocationResult {
  const totalValue = input.total_value;

  if (!Number.isFinite(totalValue) || totalValue < 0) {
    throw new Error('total_value must be a non-negative finite number');
  }

  const rates = ratesForTotalValue(totalValue);
  const taxReserve = roundToCents(totalValue * rates.taxRate);
  const opsFund = roundToCents(totalValue * rates.opsRate);
  const ownerSweep = roundToCents(totalValue * rates.ownerRate);

  return {
    tax_reserve: taxReserve,
    ops_fund: opsFund,
    owner_sweep: ownerSweep,
    total_processed: roundToCents(totalValue),
    status: ownerSweep > MIN_OWNER_SWEEP ? 'READY_FOR_RTP' : 'HOLD_IN_BUSINESS_ACCOUNT',
    timestamp: timestamp.toISOString(),
    rates,
  };
}
