const BIG_DEAL_THRESHOLD = 10000;
const MIN_OWNER_SWEEP = 10;

const RATE_TIERS = {
  standard: {
    taxRate: 0.25,
    opsRate: 0.25,
    ownerRate: 0.5,
  },
  bigDeal: {
    taxRate: 0.35,
    opsRate: 0.15,
    ownerRate: 0.5,
  },
};

function cents(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function readTotalValue(input) {
  const rawValue = input?.total_value;
  const totalValue =
    typeof rawValue === 'number'
      ? rawValue
      : typeof rawValue === 'string' && rawValue.trim() !== ''
        ? Number(rawValue)
        : Number.NaN;

  if (!Number.isFinite(totalValue)) {
    throw new TypeError('total_value must be a finite number');
  }

  if (totalValue < 0) {
    throw new RangeError('total_value must be greater than or equal to 0');
  }

  return totalValue;
}

export function calculateRevenueAllocation(input, options = {}) {
  const totalValue = readTotalValue(input);
  const rates = totalValue > BIG_DEAL_THRESHOLD ? RATE_TIERS.bigDeal : RATE_TIERS.standard;
  const ownerSweep = cents(totalValue * rates.ownerRate);

  return {
    tax_reserve: cents(totalValue * rates.taxRate),
    ops_fund: cents(totalValue * rates.opsRate),
    owner_sweep: ownerSweep,
    total_processed: totalValue,
    status: ownerSweep > MIN_OWNER_SWEEP ? 'READY_FOR_RTP' : 'HOLD_IN_BUSINESS_ACCOUNT',
    timestamp: (options.now ?? new Date()).toISOString(),
  };
}
