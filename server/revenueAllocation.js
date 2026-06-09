const LARGE_DEAL_THRESHOLD = 10000;
const OWNER_SWEEP_THRESHOLD = 10;

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

function toCents(value) {
  return Number((Math.round((value + Number.EPSILON) * 100) / 100).toFixed(2));
}

function normalizeTotalValue(totalValue) {
  const numericValue = Number(totalValue);

  if (!Number.isFinite(numericValue)) {
    throw new TypeError('total_value must be a finite number');
  }

  if (numericValue < 0) {
    throw new RangeError('total_value must be zero or greater');
  }

  return numericValue;
}

export function allocateRevenue(totalValue, options = {}) {
  const normalizedTotalValue = normalizeTotalValue(totalValue);
  const rates = normalizedTotalValue > LARGE_DEAL_THRESHOLD ? LARGE_DEAL_RATES : SMALL_DEAL_RATES;
  const ownerSweep = toCents(normalizedTotalValue * rates.owner);

  return {
    tax_reserve: toCents(normalizedTotalValue * rates.tax),
    ops_fund: toCents(normalizedTotalValue * rates.ops),
    owner_sweep: ownerSweep,
    total_processed: normalizedTotalValue,
    status: ownerSweep > OWNER_SWEEP_THRESHOLD ? 'READY_FOR_RTP' : 'HOLD_IN_BUSINESS_ACCOUNT',
    timestamp: (options.now ?? new Date()).toISOString(),
  };
}

export function allocationInputFromRequest(body) {
  return body?.total_value ?? body?.totalValue;
}
