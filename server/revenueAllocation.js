const LARGE_DEAL_THRESHOLD = 10000;
const OWNER_SWEEP_MINIMUM = 10;

const SMALL_DEAL_RATES = Object.freeze({
  tax: 0.25,
  ops: 0.25,
  owner: 0.5,
});

const LARGE_DEAL_RATES = Object.freeze({
  tax: 0.35,
  ops: 0.15,
  owner: 0.5,
});

export const REVENUE_ALLOCATION_STATUS = Object.freeze({
  READY_FOR_RTP: 'READY_FOR_RTP',
  HOLD_IN_BUSINESS_ACCOUNT: 'HOLD_IN_BUSINESS_ACCOUNT',
});

function revenueAllocationError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function parseTotalValue(input) {
  const rawValue =
    typeof input === 'object' && input !== null
      ? input.total_value ?? input.totalValue
      : input;

  const totalValue = typeof rawValue === 'string' ? Number(rawValue.trim()) : Number(rawValue);

  if (!Number.isFinite(totalValue)) {
    throw revenueAllocationError('total_value must be a finite number');
  }

  if (totalValue < 0) {
    throw revenueAllocationError('total_value must be greater than or equal to 0');
  }

  return totalValue;
}

function roundCurrency(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateRevenueAllocation(input) {
  const totalValue = parseTotalValue(input);
  const rates = totalValue > LARGE_DEAL_THRESHOLD ? LARGE_DEAL_RATES : SMALL_DEAL_RATES;
  const taxReserve = roundCurrency(totalValue * rates.tax);
  const opsFund = roundCurrency(totalValue * rates.ops);
  const ownerSweep = roundCurrency(totalValue * rates.owner);

  return {
    tax_reserve: taxReserve,
    ops_fund: opsFund,
    owner_sweep: ownerSweep,
    total_processed: totalValue,
    status:
      ownerSweep > OWNER_SWEEP_MINIMUM
        ? REVENUE_ALLOCATION_STATUS.READY_FOR_RTP
        : REVENUE_ALLOCATION_STATUS.HOLD_IN_BUSINESS_ACCOUNT,
    timestamp: new Date().toISOString(),
  };
}

