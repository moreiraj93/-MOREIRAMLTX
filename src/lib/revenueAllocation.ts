export type RevenueAllocationInput = {
  total_value: number;
};

export type RevenueAllocationStatus = 'READY_FOR_RTP' | 'HOLD_IN_BUSINESS_ACCOUNT';

export type RevenueAllocationResult = {
  tax_reserve: number;
  ops_fund: number;
  owner_sweep: number;
  total_processed: number;
  status: RevenueAllocationStatus;
  timestamp: string;
};

type AllocationRates = {
  taxRate: number;
  opsRate: number;
  ownerRate: number;
};

const LARGE_DEAL_THRESHOLD = 10000;
const OWNER_SWEEP_MINIMUM = 10;

const STANDARD_DEAL_RATES: AllocationRates = {
  taxRate: 0.25,
  opsRate: 0.25,
  ownerRate: 0.5,
};

const LARGE_DEAL_RATES: AllocationRates = {
  taxRate: 0.35,
  opsRate: 0.15,
  ownerRate: 0.5,
};

function currencyAmount(value: number): number {
  return Number((Math.round((value + Number.EPSILON) * 100) / 100).toFixed(2));
}

function ratesForTotal(totalValue: number): AllocationRates {
  return totalValue > LARGE_DEAL_THRESHOLD ? LARGE_DEAL_RATES : STANDARD_DEAL_RATES;
}

export function allocateRevenue(
  input: RevenueAllocationInput,
  timestamp: Date = new Date(),
): RevenueAllocationResult {
  const totalValue = Number(input.total_value);

  if (!Number.isFinite(totalValue) || totalValue < 0) {
    throw new Error('total_value must be a non-negative number');
  }

  const { taxRate, opsRate, ownerRate } = ratesForTotal(totalValue);
  const taxReserve = currencyAmount(totalValue * taxRate);
  const opsFund = currencyAmount(totalValue * opsRate);
  const ownerSweep = currencyAmount(totalValue * ownerRate);

  return {
    tax_reserve: taxReserve,
    ops_fund: opsFund,
    owner_sweep: ownerSweep,
    total_processed: totalValue,
    status: ownerSweep > OWNER_SWEEP_MINIMUM ? 'READY_FOR_RTP' : 'HOLD_IN_BUSINESS_ACCOUNT',
    timestamp: timestamp.toISOString(),
  };
}
