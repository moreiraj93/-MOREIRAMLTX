export const READY_FOR_RTP = 'READY_FOR_RTP';
export const HOLD_IN_BUSINESS_ACCOUNT = 'HOLD_IN_BUSINESS_ACCOUNT';

const LARGE_DEAL_THRESHOLD = 10000;
const MIN_OWNER_SWEEP = 10;

function roundToCents(value) {
  return Number(value.toFixed(2));
}

export function parseTotalValue(input) {
  const rawValue = input?.total_value;
  const totalValue = typeof rawValue === 'string' ? Number(rawValue) : rawValue;

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

export function ratesForTotal(totalValue) {
  if (totalValue > LARGE_DEAL_THRESHOLD) {
    return {
      taxRate: 0.35,
      opsRate: 0.15,
      ownerRate: 0.5,
    };
  }

  return {
    taxRate: 0.25,
    opsRate: 0.25,
    ownerRate: 0.5,
  };
}

export function allocateRevenue(input, now = () => new Date()) {
  const totalValue = parseTotalValue(input);
  const { taxRate, opsRate, ownerRate } = ratesForTotal(totalValue);

  const taxReserve = roundToCents(totalValue * taxRate);
  const opsFund = roundToCents(totalValue * opsRate);
  const ownerSweep = roundToCents(totalValue * ownerRate);

  return {
    tax_reserve: taxReserve,
    ops_fund: opsFund,
    owner_sweep: ownerSweep,
    total_processed: totalValue,
    status: ownerSweep > MIN_OWNER_SWEEP ? READY_FOR_RTP : HOLD_IN_BUSINESS_ACCOUNT,
    timestamp: now().toISOString(),
  };
}
