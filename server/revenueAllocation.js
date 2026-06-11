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

function toCurrencyAmount(value) {
  return Number(value.toFixed(2));
}

function normalizeTotalValue(totalValue) {
  const numericValue =
    typeof totalValue === 'string' && totalValue.trim() !== ''
      ? Number(totalValue)
      : totalValue;

  if (typeof numericValue !== 'number' || !Number.isFinite(numericValue)) {
    throw new Error('total_value must be a finite number');
  }

  if (numericValue < 0) {
    throw new Error('total_value must be greater than or equal to 0');
  }

  return numericValue;
}

export function calculateRevenueAllocation(input, now = new Date()) {
  const totalValue = normalizeTotalValue(input?.total_value);
  const rates = totalValue > LARGE_DEAL_THRESHOLD ? LARGE_DEAL_RATES : SMALL_DEAL_RATES;

  const taxReserve = toCurrencyAmount(totalValue * rates.tax);
  const opsFund = toCurrencyAmount(totalValue * rates.ops);
  const ownerSweep = toCurrencyAmount(totalValue * rates.owner);

  return {
    tax_reserve: taxReserve,
    ops_fund: opsFund,
    owner_sweep: ownerSweep,
    total_processed: totalValue,
    status: ownerSweep > OWNER_SWEEP_MINIMUM ? 'READY_FOR_RTP' : 'HOLD_IN_BUSINESS_ACCOUNT',
    timestamp: now.toISOString(),
  };
}

export const revenueAllocationConfig = {
  largeDealThreshold: LARGE_DEAL_THRESHOLD,
  ownerSweepMinimum: OWNER_SWEEP_MINIMUM,
  smallDealRates: SMALL_DEAL_RATES,
  largeDealRates: LARGE_DEAL_RATES,
};
