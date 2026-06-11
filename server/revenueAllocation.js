const BIG_DEAL_THRESHOLD = 10000;
const OWNER_SWEEP_MINIMUM = 10;

const SMALL_DEAL_RATES = {
  tax: 0.25,
  ops: 0.25,
  owner: 0.5,
};

const BIG_DEAL_RATES = {
  tax: 0.35,
  ops: 0.15,
  owner: 0.5,
};

function roundCurrency(value) {
  return Number((Math.round((value + Number.EPSILON) * 100) / 100).toFixed(2));
}

export function normalizeTotalValue(totalValue) {
  const amount = typeof totalValue === 'string' && totalValue.trim() !== '' ? Number(totalValue) : totalValue;

  if (typeof amount !== 'number' || !Number.isFinite(amount)) {
    throw new Error('total_value must be a finite number');
  }

  if (amount < 0) {
    throw new Error('total_value must be greater than or equal to 0');
  }

  return amount;
}

export function ratesForTotalValue(totalValue) {
  return totalValue > BIG_DEAL_THRESHOLD ? BIG_DEAL_RATES : SMALL_DEAL_RATES;
}

export function calculateRevenueAllocation(input, now = new Date()) {
  const totalValue = normalizeTotalValue(input?.total_value);
  const rates = ratesForTotalValue(totalValue);
  const taxReserve = roundCurrency(totalValue * rates.tax);
  const opsFund = roundCurrency(totalValue * rates.ops);
  const ownerSweep = roundCurrency(totalValue * rates.owner);

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
  bigDealThreshold: BIG_DEAL_THRESHOLD,
  ownerSweepMinimum: OWNER_SWEEP_MINIMUM,
  smallDealRates: SMALL_DEAL_RATES,
  bigDealRates: BIG_DEAL_RATES,
};
