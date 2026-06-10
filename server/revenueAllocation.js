export const BIG_DEAL_THRESHOLD = 10000;
export const MIN_OWNER_SWEEP = 10;

export const ALLOCATION_TIERS = {
  bigDeal: {
    taxRate: 0.35,
    opsRate: 0.15,
    ownerRate: 0.5,
  },
  standard: {
    taxRate: 0.25,
    opsRate: 0.25,
    ownerRate: 0.5,
  },
};

function assertValidTotalValue(totalValue) {
  if (typeof totalValue !== 'number' || !Number.isFinite(totalValue)) {
    const error = new Error('total_value must be a finite number');
    error.statusCode = 400;
    throw error;
  }

  if (totalValue < 0) {
    const error = new Error('total_value must be greater than or equal to 0');
    error.statusCode = 400;
    throw error;
  }
}

function toCurrencyAmount(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function parseTotalValue(input) {
  const rawValue = input?.total_value;
  const totalValue = typeof rawValue === 'string' && rawValue.trim() !== ''
    ? Number(rawValue)
    : rawValue;

  assertValidTotalValue(totalValue);
  return totalValue;
}

export function calculateRevenueAllocation(input, options = {}) {
  const totalValue = parseTotalValue(input);
  const now = options.now ?? new Date();
  const tier = totalValue > BIG_DEAL_THRESHOLD ? ALLOCATION_TIERS.bigDeal : ALLOCATION_TIERS.standard;

  const taxReserve = toCurrencyAmount(totalValue * tier.taxRate);
  const opsFund = toCurrencyAmount(totalValue * tier.opsRate);
  const ownerSweep = toCurrencyAmount(totalValue * tier.ownerRate);

  return {
    tax_reserve: taxReserve,
    ops_fund: opsFund,
    owner_sweep: ownerSweep,
    total_processed: totalValue,
    status: ownerSweep > MIN_OWNER_SWEEP ? 'READY_FOR_RTP' : 'HOLD_IN_BUSINESS_ACCOUNT',
    timestamp: now.toISOString(),
  };
}
