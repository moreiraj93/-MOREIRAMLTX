const BIG_DEAL_THRESHOLD_CENTS = 1000000;
const READY_FOR_RTP_MINIMUM_CENTS = 1000;

const SMALL_DEAL_RATES = {
  tax: 25,
  ops: 25,
  owner: 50,
};

const BIG_DEAL_RATES = {
  tax: 35,
  ops: 15,
  owner: 50,
};

function parseTotalValue(totalValue) {
  const amount =
    typeof totalValue === 'string' && totalValue.trim() !== ''
      ? Number(totalValue)
      : totalValue;

  if (typeof amount !== 'number' || !Number.isFinite(amount)) {
    throw new TypeError('total_value must be a finite number');
  }

  if (amount < 0) {
    throw new RangeError('total_value cannot be negative');
  }

  return Math.round(amount * 100);
}

function dollarsFromCents(cents) {
  return Number((cents / 100).toFixed(2));
}

function centsByRate(totalCents, ratePercent) {
  return Math.round((totalCents * ratePercent) / 100);
}

export function getRevenueAllocationRates(totalValue) {
  const totalCents = parseTotalValue(totalValue);
  return totalCents > BIG_DEAL_THRESHOLD_CENTS ? BIG_DEAL_RATES : SMALL_DEAL_RATES;
}

export function allocateRevenue(input, options = {}) {
  const totalCents = parseTotalValue(input?.total_value);
  const rates = totalCents > BIG_DEAL_THRESHOLD_CENTS ? BIG_DEAL_RATES : SMALL_DEAL_RATES;
  const taxReserveCents = centsByRate(totalCents, rates.tax);
  const ownerSweepCents = centsByRate(totalCents, rates.owner);
  const opsFundCents = totalCents - taxReserveCents - ownerSweepCents;
  const now = options.now instanceof Date ? options.now : new Date();

  return {
    tax_reserve: dollarsFromCents(taxReserveCents),
    ops_fund: dollarsFromCents(opsFundCents),
    owner_sweep: dollarsFromCents(ownerSweepCents),
    total_processed: dollarsFromCents(totalCents),
    status:
      ownerSweepCents > READY_FOR_RTP_MINIMUM_CENTS
        ? 'READY_FOR_RTP'
        : 'HOLD_IN_BUSINESS_ACCOUNT',
    timestamp: now.toISOString(),
  };
}
