export type RevenueAllocationStatus = 'READY_FOR_RTP' | 'HOLD_IN_BUSINESS_ACCOUNT';

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

export const LARGE_DEAL_THRESHOLD = 10000;
export const OWNER_SWEEP_MINIMUM = 10;

export const SMALL_DEAL_RATES: RevenueAllocationRates = {
  taxRate: 0.25,
  opsRate: 0.25,
  ownerRate: 0.5,
};

export const LARGE_DEAL_RATES: RevenueAllocationRates = {
  taxRate: 0.35,
  opsRate: 0.15,
  ownerRate: 0.5,
};

function normalizeTotalValue(totalValue: RevenueAllocationInput['total_value']): number {
  const value = typeof totalValue === 'string' ? Number(totalValue.trim()) : totalValue;

  if (!Number.isFinite(value)) {
    throw new Error('total_value must be a finite number.');
  }

  if (value < 0) {
    throw new Error('total_value cannot be negative.');
  }

  return value;
}

function roundCurrency(value: number): number {
  return Number((Math.round((value + Number.EPSILON) * 100) / 100).toFixed(2));
}

export function getRevenueAllocationRates(totalValue: number): RevenueAllocationRates {
  return totalValue > LARGE_DEAL_THRESHOLD ? LARGE_DEAL_RATES : SMALL_DEAL_RATES;
}

export function allocateRevenue(
  input: RevenueAllocationInput,
  timestamp: Date = new Date(),
): RevenueAllocationResult {
  const totalValue = normalizeTotalValue(input.total_value);
  const { taxRate, opsRate, ownerRate } = getRevenueAllocationRates(totalValue);

  const taxReserve = roundCurrency(totalValue * taxRate);
  const opsFund = roundCurrency(totalValue * opsRate);
  const ownerSweep = roundCurrency(totalValue * ownerRate);

  return {
    tax_reserve: taxReserve,
    ops_fund: opsFund,
    owner_sweep: ownerSweep,
    total_processed: totalValue,
    status: ownerSweep > OWNER_SWEEP_MINIMUM ? 'READY_FOR_RTP' : 'HOLD_IN_BUSINESS_ACCOUNT',
    timestamp: timestamp.toISOString(),
  };
}
