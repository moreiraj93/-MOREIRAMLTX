const LARGE_DEAL_THRESHOLD = 10000;
const OWNER_SWEEP_THRESHOLD = 10;

const SMALL_DEAL_RATES = {
  taxRate: 0.25,
  opsRate: 0.25,
  ownerRate: 0.5,
};

const LARGE_DEAL_RATES = {
  taxRate: 0.35,
  opsRate: 0.15,
  ownerRate: 0.5,
};

function parseTotalValue(value) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim() !== '') return Number(value);
  return NaN;
}

function roundCurrency(value) {
  return Number(value.toFixed(2));
}

export function calculateRevenueAllocation(input, clock = () => new Date()) {
  const totalValue = parseTotalValue(input?.total_value);

  if (!Number.isFinite(totalValue) || totalValue <= 0) {
    const error = new Error('total_value must be a positive number');
    error.statusCode = 400;
    throw error;
  }

  const rates = totalValue > LARGE_DEAL_THRESHOLD ? LARGE_DEAL_RATES : SMALL_DEAL_RATES;
  const taxReserve = roundCurrency(totalValue * rates.taxRate);
  const opsFund = roundCurrency(totalValue * rates.opsRate);
  const ownerSweep = roundCurrency(totalValue * rates.ownerRate);

  return {
    tax_reserve: taxReserve,
    ops_fund: opsFund,
    owner_sweep: ownerSweep,
    total_processed: totalValue,
    status: ownerSweep > OWNER_SWEEP_THRESHOLD ? 'READY_FOR_RTP' : 'HOLD_IN_BUSINESS_ACCOUNT',
    timestamp: clock().toISOString(),
  };
}
