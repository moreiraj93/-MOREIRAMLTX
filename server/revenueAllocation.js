const BIG_DEAL_THRESHOLD_CENTS = 10000 * 100;
const OWNER_SWEEP_MINIMUM_CENTS = 10 * 100;

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

function normalizeAmountToCents(value) {
  if (typeof value === 'string' && value.trim() === '') {
    throw new Error('total_value must be a positive number');
  }

  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('total_value must be a positive number');
  }

  return Math.round(amount * 100);
}

function centsToDollars(cents) {
  return Number((cents / 100).toFixed(2));
}

function allocationRatesFor(totalCents) {
  return totalCents > BIG_DEAL_THRESHOLD_CENTS ? BIG_DEAL_RATES : SMALL_DEAL_RATES;
}

export function calculateRevenueAllocation(input, now = new Date()) {
  const totalCents = normalizeAmountToCents(input?.total_value);
  const rates = allocationRatesFor(totalCents);

  const taxReserveCents = Math.round(totalCents * rates.tax);
  const opsFundCents = Math.round(totalCents * rates.ops);
  const ownerSweepCents = totalCents - taxReserveCents - opsFundCents;

  return {
    tax_reserve: centsToDollars(taxReserveCents),
    ops_fund: centsToDollars(opsFundCents),
    owner_sweep: centsToDollars(ownerSweepCents),
    total_processed: centsToDollars(totalCents),
    status: ownerSweepCents > OWNER_SWEEP_MINIMUM_CENTS
      ? 'READY_FOR_RTP'
      : 'HOLD_IN_BUSINESS_ACCOUNT',
    timestamp: now.toISOString(),
  };
}

