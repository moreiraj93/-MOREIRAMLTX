export type RevenueAllocationStatus = 'READY_FOR_RTP' | 'HOLD_IN_BUSINESS_ACCOUNT';

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

interface AllocationRates {
  taxRate: number;
  opsRate: number;
  ownerRate: number;
}

const HIGH_VALUE_THRESHOLD = 10000;
const MIN_OWNER_SWEEP = 10;

export function getRevenueAllocationRates(totalValue: number): AllocationRates {
  if (totalValue > HIGH_VALUE_THRESHOLD) {
    return {
      taxRate: 0.35,
      opsRate: 0.15,
      ownerRate: 0.5,
    };
  }

  return {
    taxRate: 0.25,
    opsRate: 0.25,
    ownerRate: 0.5,
  };
}

function roundCurrency(value: number): number {
  return Number((Math.round((value + Number.EPSILON) * 100) / 100).toFixed(2));
}

export function calculateRevenueAllocation(
  input: RevenueAllocationInput,
  now: Date = new Date(),
): RevenueAllocationResult {
  const totalValue = Number(input?.total_value);

  if (!Number.isFinite(totalValue) || totalValue < 0) {
    throw new Error('total_value must be a finite, non-negative number.');
  }

  const totalProcessed = roundCurrency(totalValue);
  const { taxRate, opsRate, ownerRate } = getRevenueAllocationRates(totalValue);
  const ownerSweep = roundCurrency(totalProcessed * ownerRate);

  return {
    tax_reserve: roundCurrency(totalProcessed * taxRate),
    ops_fund: roundCurrency(totalProcessed * opsRate),
    owner_sweep: ownerSweep,
    total_processed: totalProcessed,
    status: ownerSweep > MIN_OWNER_SWEEP ? 'READY_FOR_RTP' : 'HOLD_IN_BUSINESS_ACCOUNT',
    timestamp: now.toISOString(),
  };
}
