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

const BIG_DEAL_THRESHOLD = 10_000;
const MIN_OWNER_SWEEP = 10;

const SMALL_DEAL_RATES = {
  taxRate: 0.25,
  opsRate: 0.25,
  ownerRate: 0.5,
} as const;

const BIG_DEAL_RATES = {
  taxRate: 0.35,
  opsRate: 0.15,
  ownerRate: 0.5,
} as const;

function normalizeTotalValue(value: RevenueAllocationInput['total_value']): number {
  const totalValue = typeof value === 'string' ? Number(value) : value;

  if (!Number.isFinite(totalValue) || totalValue < 0) {
    throw new Error('total_value must be a non-negative number.');
  }

  return totalValue;
}

function roundToCents(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function allocateRevenue(
  input: RevenueAllocationInput,
  timestamp = new Date().toISOString(),
): RevenueAllocationResult {
  const totalValue = normalizeTotalValue(input.total_value);
  const rates = totalValue > BIG_DEAL_THRESHOLD ? BIG_DEAL_RATES : SMALL_DEAL_RATES;

  const taxReserve = roundToCents(totalValue * rates.taxRate);
  const opsFund = roundToCents(totalValue * rates.opsRate);
  const ownerSweep = roundToCents(totalValue * rates.ownerRate);

  return {
    tax_reserve: taxReserve,
    ops_fund: opsFund,
    owner_sweep: ownerSweep,
    total_processed: totalValue,
    status: ownerSweep > MIN_OWNER_SWEEP ? 'READY_FOR_RTP' : 'HOLD_IN_BUSINESS_ACCOUNT',
    timestamp,
  };
}
