export const REVENUE_ALLOCATION_STATUS = {
  READY_FOR_RTP: 'READY_FOR_RTP',
  HOLD_IN_BUSINESS_ACCOUNT: 'HOLD_IN_BUSINESS_ACCOUNT',
};

const CENTS_PER_DOLLAR = 100;
const LARGE_DEAL_THRESHOLD_CENTS = 10000 * CENTS_PER_DOLLAR;
const MIN_OWNER_SWEEP_CENTS = 10 * CENTS_PER_DOLLAR;

const SMALL_DEAL_RATES = {
  taxRate: 0.25,
  opsRate: 0.25,
};

const LARGE_DEAL_RATES = {
  taxRate: 0.35,
  opsRate: 0.15,
};

export class RevenueAllocationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'RevenueAllocationError';
    this.statusCode = 400;
  }
}

function toCents(value) {
  const totalValue = Number(value);

  if (!Number.isFinite(totalValue)) {
    throw new RevenueAllocationError('total_value must be a finite number');
  }

  if (totalValue < 0) {
    throw new RevenueAllocationError('total_value must be zero or greater');
  }

  return Math.round((totalValue + Number.EPSILON) * CENTS_PER_DOLLAR);
}

function fromCents(cents) {
  return Number((cents / CENTS_PER_DOLLAR).toFixed(2));
}

function ratesForTotal(totalCents) {
  return totalCents > LARGE_DEAL_THRESHOLD_CENTS ? LARGE_DEAL_RATES : SMALL_DEAL_RATES;
}

export function allocateRevenue(input, { now = () => new Date() } = {}) {
  const totalCents = toCents(input?.total_value);
  const { taxRate, opsRate } = ratesForTotal(totalCents);

  const taxReserveCents = Math.round(totalCents * taxRate);
  const opsFundCents = Math.round(totalCents * opsRate);
  const ownerSweepCents = totalCents - taxReserveCents - opsFundCents;

  return {
    tax_reserve: fromCents(taxReserveCents),
    ops_fund: fromCents(opsFundCents),
    owner_sweep: fromCents(ownerSweepCents),
    total_processed: fromCents(totalCents),
    status:
      ownerSweepCents > MIN_OWNER_SWEEP_CENTS
        ? REVENUE_ALLOCATION_STATUS.READY_FOR_RTP
        : REVENUE_ALLOCATION_STATUS.HOLD_IN_BUSINESS_ACCOUNT,
    timestamp: now().toISOString(),
  };
}
