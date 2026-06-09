const LARGE_DEAL_THRESHOLD = 10000;
const OWNER_SWEEP_THRESHOLD = 10;
const BASIS_POINTS_PER_RATE = 10000;
const CENTS_PER_DOLLAR = 100;

const SMALL_DEAL_RATES = {
  tax: 2500,
  ops: 2500,
  owner: 5000,
};

const LARGE_DEAL_RATES = {
  tax: 3500,
  ops: 1500,
  owner: 5000,
};

function dollarsToCents(value) {
  return Math.round((value + Number.EPSILON) * CENTS_PER_DOLLAR);
}

function centsToDollars(cents) {
  return Number((cents / CENTS_PER_DOLLAR).toFixed(2));
}

function allocateCents(totalCents, basisPoints) {
  return centsToDollars(Math.round((totalCents * basisPoints) / BASIS_POINTS_PER_RATE));
}

function normalizeTotalValue(totalValue) {
  const numericValue = Number(totalValue);

  if (!Number.isFinite(numericValue)) {
    throw new TypeError('total_value must be a finite number');
  }

  if (numericValue < 0) {
    throw new RangeError('total_value must be zero or greater');
  }

  return numericValue;
}

export function allocateRevenue(totalValue, options = {}) {
  const normalizedTotalValue = normalizeTotalValue(totalValue);
  const rates = normalizedTotalValue > LARGE_DEAL_THRESHOLD ? LARGE_DEAL_RATES : SMALL_DEAL_RATES;
  const totalCents = dollarsToCents(normalizedTotalValue);
  const ownerSweep = allocateCents(totalCents, rates.owner);

  return {
    tax_reserve: allocateCents(totalCents, rates.tax),
    ops_fund: allocateCents(totalCents, rates.ops),
    owner_sweep: ownerSweep,
    total_processed: normalizedTotalValue,
    status: ownerSweep > OWNER_SWEEP_THRESHOLD ? 'READY_FOR_RTP' : 'HOLD_IN_BUSINESS_ACCOUNT',
    timestamp: (options.now ?? new Date()).toISOString(),
  };
}

export function allocationInputFromRequest(body) {
  return body?.total_value ?? body?.totalValue;
}
