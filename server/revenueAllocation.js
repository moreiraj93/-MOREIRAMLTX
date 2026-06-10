const LARGE_DEAL_THRESHOLD = 10000;
const MIN_OWNER_SWEEP = 10;

const SMALL_DEAL_RATES = {
  tax: 0.25,
  operations: 0.25,
  owner: 0.5,
};

const LARGE_DEAL_RATES = {
  tax: 0.35,
  operations: 0.15,
  owner: 0.5,
};

export const REVENUE_ALLOCATION_STATUS = {
  readyForRtp: 'READY_FOR_RTP',
  holdInBusinessAccount: 'HOLD_IN_BUSINESS_ACCOUNT',
};

export function parseTotalValue(rawValue) {
  const totalValue =
    typeof rawValue === 'string' && rawValue.trim() !== '' ? Number(rawValue) : rawValue;

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

  return totalValue;
}

export function allocationRatesFor(totalValue) {
  return totalValue > LARGE_DEAL_THRESHOLD ? LARGE_DEAL_RATES : SMALL_DEAL_RATES;
}

function roundCurrency(value) {
  return Number(value.toFixed(2));
}

export function allocateRevenue(input, timestamp = new Date().toISOString()) {
  const totalValue = parseTotalValue(input?.total_value);
  const rates = allocationRatesFor(totalValue);
  const ownerSweep = roundCurrency(totalValue * rates.owner);

  return {
    tax_reserve: roundCurrency(totalValue * rates.tax),
    ops_fund: roundCurrency(totalValue * rates.operations),
    owner_sweep: ownerSweep,
    total_processed: totalValue,
    status:
      ownerSweep > MIN_OWNER_SWEEP
        ? REVENUE_ALLOCATION_STATUS.readyForRtp
        : REVENUE_ALLOCATION_STATUS.holdInBusinessAccount,
    timestamp,
  };
}
