const BIG_DEAL_THRESHOLD_CENTS = 10_000_00;
const MIN_OWNER_SWEEP_CENTS = 10_00;

const BIG_DEAL_RATES = {
  tax: 0.35,
  ops: 0.15,
};

const STANDARD_DEAL_RATES = {
  tax: 0.25,
  ops: 0.25,
};

function normalizeTotalValue(value) {
  if (value === null || value === undefined || value === '') {
    throw new Error('total_value is required');
  }

  const totalValue = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(totalValue)) {
    throw new Error('total_value must be a finite number');
  }

  if (totalValue < 0) {
    throw new Error('total_value must be greater than or equal to 0');
  }

  return Math.round(totalValue * 100);
}

function dollars(cents) {
  return Number((cents / 100).toFixed(2));
}

export function allocateRevenue(input, options = {}) {
  const rawTotalValue =
    typeof input === 'object' && input !== null ? input.total_value ?? input.totalValue : input;
  const totalCents = normalizeTotalValue(rawTotalValue);
  const rates = totalCents > BIG_DEAL_THRESHOLD_CENTS ? BIG_DEAL_RATES : STANDARD_DEAL_RATES;

  const taxCents = Math.round(totalCents * rates.tax);
  const opsCents = Math.round(totalCents * rates.ops);
  const ownerCents = totalCents - taxCents - opsCents;

  return {
    tax_reserve: dollars(taxCents),
    ops_fund: dollars(opsCents),
    owner_sweep: dollars(ownerCents),
    total_processed: dollars(totalCents),
    status: ownerCents > MIN_OWNER_SWEEP_CENTS ? 'READY_FOR_RTP' : 'HOLD_IN_BUSINESS_ACCOUNT',
    timestamp: (options.now ?? new Date()).toISOString(),
  };
}
