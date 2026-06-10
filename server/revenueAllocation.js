export const BIG_DEAL_THRESHOLD = 10000;
export const MIN_OWNER_SWEEP = 10;

export const ALLOCATION_RATES = Object.freeze({
  standard: Object.freeze({
    taxRate: 0.25,
    opsRate: 0.25,
    ownerRate: 0.5,
  }),
  bigDeal: Object.freeze({
    taxRate: 0.35,
    opsRate: 0.15,
    ownerRate: 0.5,
  }),
});

export class RevenueAllocationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'RevenueAllocationError';
    this.statusCode = 400;
  }
}

function normalizeTotalValue(value) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim() !== '') return Number(value);
  return Number.NaN;
}

function roundCurrency(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function allocateRevenue(input = {}, now = new Date()) {
  const totalValue = normalizeTotalValue(input.total_value);

  if (!Number.isFinite(totalValue)) {
    throw new RevenueAllocationError('total_value must be a finite number');
  }

  if (totalValue < 0) {
    throw new RevenueAllocationError('total_value must be greater than or equal to 0');
  }

  const tier = totalValue > BIG_DEAL_THRESHOLD ? 'bigDeal' : 'standard';
  const rates = ALLOCATION_RATES[tier];
  const ownerSweep = roundCurrency(totalValue * rates.ownerRate);

  return {
    tax_reserve: roundCurrency(totalValue * rates.taxRate),
    ops_fund: roundCurrency(totalValue * rates.opsRate),
    owner_sweep: ownerSweep,
    total_processed: totalValue,
    status: ownerSweep > MIN_OWNER_SWEEP ? 'READY_FOR_RTP' : 'HOLD_IN_BUSINESS_ACCOUNT',
    tier,
    rates,
    timestamp: now.toISOString(),
  };
}
