const LARGE_DEAL_THRESHOLD_CENTS = 1_000_000;
const OWNER_SWEEP_MINIMUM_CENTS = 1_000;

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

function asFiniteAmount(value) {
  const amount = typeof value === 'string' ? Number(value.trim()) : value;

  if (typeof amount !== 'number' || !Number.isFinite(amount)) {
    throw new Error('total_value must be a finite number');
  }

  if (amount < 0) {
    throw new Error('total_value must be greater than or equal to 0');
  }

  return amount;
}

function toCents(amount) {
  return Math.round(amount * 100);
}

function fromCents(cents) {
  return Number((cents / 100).toFixed(2));
}

export function allocateRevenue(input, options = {}) {
  const totalValue = asFiniteAmount(input?.total_value);
  const totalCents = toCents(totalValue);
  const rates = totalCents > LARGE_DEAL_THRESHOLD_CENTS ? LARGE_DEAL_RATES : SMALL_DEAL_RATES;

  const taxReserveCents = Math.round(totalCents * rates.tax);
  const opsFundCents = Math.round(totalCents * rates.ops);
  const ownerSweepCents = totalCents - taxReserveCents - opsFundCents;
  const timestamp = options.timestamp ?? new Date().toISOString();

  return {
    tax_reserve: fromCents(taxReserveCents),
    ops_fund: fromCents(opsFundCents),
    owner_sweep: fromCents(ownerSweepCents),
    total_processed: fromCents(totalCents),
    status: ownerSweepCents > OWNER_SWEEP_MINIMUM_CENTS ? 'READY_FOR_RTP' : 'HOLD_IN_BUSINESS_ACCOUNT',
    timestamp,
  };
}
