const HIGH_VALUE_THRESHOLD = 10000;
const MIN_OWNER_SWEEP = 10;

const SMALL_DEAL_RATES = {
  taxRate: 0.25,
  opsRate: 0.25,
  ownerRate: 0.5,
};

const HIGH_VALUE_DEAL_RATES = {
  taxRate: 0.35,
  opsRate: 0.15,
  ownerRate: 0.5,
};

function money(value) {
  return Number(value.toFixed(2));
}

function parseTotalValue(input) {
  const rawValue = input?.total_value;
  const totalValue = typeof rawValue === 'string' && rawValue.trim() !== ''
    ? Number(rawValue)
    : rawValue;

  if (typeof totalValue !== 'number' || !Number.isFinite(totalValue)) {
    throw new TypeError('total_value must be a finite number');
  }

  if (totalValue < 0) {
    throw new RangeError('total_value must be greater than or equal to 0');
  }

  return totalValue;
}

export function revenueAllocationRates(totalValue) {
  return totalValue > HIGH_VALUE_THRESHOLD ? HIGH_VALUE_DEAL_RATES : SMALL_DEAL_RATES;
}

export function allocateRevenue(input, timestamp = new Date()) {
  const totalValue = parseTotalValue(input);
  const { taxRate, opsRate, ownerRate } = revenueAllocationRates(totalValue);

  const taxReserve = money(totalValue * taxRate);
  const opsFund = money(totalValue * opsRate);
  const ownerSweep = money(totalValue * ownerRate);

  return {
    tax_reserve: taxReserve,
    ops_fund: opsFund,
    owner_sweep: ownerSweep,
    total_processed: totalValue,
    status: ownerSweep > MIN_OWNER_SWEEP ? 'READY_FOR_RTP' : 'HOLD_IN_BUSINESS_ACCOUNT',
    timestamp: timestamp.toISOString(),
  };
}
