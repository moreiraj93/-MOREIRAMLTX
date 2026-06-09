const LARGE_DEAL_THRESHOLD = 10000;
const OWNER_SWEEP_MINIMUM = 10;

const SMALL_DEAL_RATES = {
  tax: 0.25,
  ops: 0.25,
  owner: 0.5,
};

const LARGE_DEAL_RATES = {
  tax: 0.35,
  ops: 0.15,
  owner: 0.5,
};

function normalizeTotalValue(value) {
  const totalValue = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;

  if (typeof totalValue !== 'number' || !Number.isFinite(totalValue)) {
    throw new TypeError('total_value must be a finite number');
  }

  if (totalValue < 0) {
    throw new RangeError('total_value must be greater than or equal to 0');
  }

  return totalValue;
}

function currency(value) {
  return Number(value.toFixed(2));
}

export function allocateRevenue(input = {}, now = new Date()) {
  const totalValue = normalizeTotalValue(input.total_value);
  const rates = totalValue > LARGE_DEAL_THRESHOLD ? LARGE_DEAL_RATES : SMALL_DEAL_RATES;
  const ownerSweep = currency(totalValue * rates.owner);

  return {
    tax_reserve: currency(totalValue * rates.tax),
    ops_fund: currency(totalValue * rates.ops),
    owner_sweep: ownerSweep,
    total_processed: totalValue,
    status: ownerSweep > OWNER_SWEEP_MINIMUM ? 'READY_FOR_RTP' : 'HOLD_IN_BUSINESS_ACCOUNT',
    timestamp: now.toISOString(),
  };
}
