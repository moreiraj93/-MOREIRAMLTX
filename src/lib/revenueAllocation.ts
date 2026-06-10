export type RevenueAllocationStatus = 'READY_FOR_RTP' | 'HOLD_IN_BUSINESS_ACCOUNT';
export type RevenueAllocationTier = 'standard' | 'large_deal';

export interface RevenueAllocationInput {
  total_value: number;
}

export interface RevenueAllocationResult {
  tax_reserve: number;
  ops_fund: number;
  owner_sweep: number;
  total_processed: number;
  status: RevenueAllocationStatus;
  timestamp: string;
}

interface RevenueAllocationRates {
  taxRate: number;
  opsRate: number;
  ownerRate: number;
}

export const LARGE_DEAL_THRESHOLD = 10_000;
export const OWNER_SWEEP_MINIMUM = 10;

export const REVENUE_ALLOCATION_RATES: Record<RevenueAllocationTier, RevenueAllocationRates> = {
  standard: {
    taxRate: 0.25,
    opsRate: 0.25,
    ownerRate: 0.5,
  },
  large_deal: {
    taxRate: 0.35,
    opsRate: 0.15,
    ownerRate: 0.5,
  },
};

export function getRevenueAllocationTier(totalValue: number): RevenueAllocationTier {
  validateTotalValue(totalValue);
  return totalValue > LARGE_DEAL_THRESHOLD ? 'large_deal' : 'standard';
}

export function allocateRevenue(
  input: RevenueAllocationInput,
  processedAt: Date = new Date(),
): RevenueAllocationResult {
  const totalValue = input.total_value;
  validateTotalValue(totalValue);

  const tier = getRevenueAllocationTier(totalValue);
  const { taxRate, opsRate, ownerRate } = REVENUE_ALLOCATION_RATES[tier];

  const taxReserve = roundCurrency(totalValue * taxRate);
  const opsFund = roundCurrency(totalValue * opsRate);
  const ownerSweep = roundCurrency(totalValue * ownerRate);

  return {
    tax_reserve: taxReserve,
    ops_fund: opsFund,
    owner_sweep: ownerSweep,
    total_processed: totalValue,
    status: ownerSweep > OWNER_SWEEP_MINIMUM ? 'READY_FOR_RTP' : 'HOLD_IN_BUSINESS_ACCOUNT',
    timestamp: processedAt.toISOString(),
  };
}

function validateTotalValue(totalValue: number): void {
  if (typeof totalValue !== 'number' || !Number.isFinite(totalValue)) {
    throw new TypeError('total_value must be a finite number');
  }

  if (totalValue < 0) {
    throw new RangeError('total_value must be greater than or equal to 0');
  }
}

function roundCurrency(value: number): number {
  return Number(value.toFixed(2));
}
