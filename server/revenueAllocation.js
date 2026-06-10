export const REVENUE_ALLOCATION_THRESHOLD = 10000;
export const READY_FOR_RTP_MINIMUM = 10;

export const REVENUE_ALLOCATION_RATES = {
  largeDeal: {
    tax: 0.35,
    ops: 0.15,
    owner: 0.5,
  },
  standardDeal: {
    tax: 0.25,
    ops: 0.25,
    owner: 0.5,
  },
};

function parseTotalValue(rawTotalValue) {
  if (
    rawTotalValue === null ||
    (typeof rawTotalValue === 'string' && rawTotalValue.trim() === '')
  ) {
    throw new TypeError('total_value must be a finite number');
  }

  const totalValue =
    typeof rawTotalValue === 'string' ? Number(rawTotalValue.trim()) : Number(rawTotalValue);

  if (!Number.isFinite(totalValue)) {
    throw new TypeError('total_value must be a finite number');
  }

  if (totalValue < 0) {
    throw new RangeError('total_value must be greater than or equal to 0');
  }

  return totalValue;
}

function toCurrencyAmount(value) {
  return Number(value.toFixed(2));
}

export function calculateRevenueAllocation(input, timestamp = new Date()) {
  const totalValue = parseTotalValue(input?.total_value);
  const rates =
    totalValue > REVENUE_ALLOCATION_THRESHOLD
      ? REVENUE_ALLOCATION_RATES.largeDeal
      : REVENUE_ALLOCATION_RATES.standardDeal;

  const taxReserve = toCurrencyAmount(totalValue * rates.tax);
  const opsFund = toCurrencyAmount(totalValue * rates.ops);
  const ownerSweep = toCurrencyAmount(totalValue * rates.owner);

  return {
    tax_reserve: taxReserve,
    ops_fund: opsFund,
    owner_sweep: ownerSweep,
    total_processed: totalValue,
    status: ownerSweep > READY_FOR_RTP_MINIMUM ? 'READY_FOR_RTP' : 'HOLD_IN_BUSINESS_ACCOUNT',
    timestamp: timestamp.toISOString(),
  };
}
