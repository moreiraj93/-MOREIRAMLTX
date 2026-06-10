const BIG_DEAL_THRESHOLD_CENTS = 1_000_000;
const OWNER_SWEEP_MINIMUM_CENTS = 1_000;

const SMALL_DEAL_RATES = {
  taxReserveBps: 2500,
  opsFundBps: 2500,
  ownerSweepBps: 5000,
};

const BIG_DEAL_RATES = {
  taxReserveBps: 3500,
  opsFundBps: 1500,
  ownerSweepBps: 5000,
};

function parseAmountToCents(value) {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new TypeError('total_value must be a finite number');
    }
    return Math.round(value * 100);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) {
      throw new TypeError('total_value must be a positive currency amount');
    }

    const [dollars, cents = ''] = trimmed.split('.');
    return Number(dollars) * 100 + Number(cents.padEnd(2, '0'));
  }

  throw new TypeError('total_value must be provided as a number or currency string');
}

function centsToDollars(cents) {
  return Number((cents / 100).toFixed(2));
}

function allocateByBasisPoints(totalCents, rates) {
  const taxReserveCents = Math.round((totalCents * rates.taxReserveBps) / 10_000);
  const opsFundCents = Math.round((totalCents * rates.opsFundBps) / 10_000);
  const ownerSweepCents = totalCents - taxReserveCents - opsFundCents;

  return {
    taxReserveCents,
    opsFundCents,
    ownerSweepCents,
  };
}

export function calculateRevenueAllocation(input, now = new Date()) {
  const totalValue = input?.total_value;
  const totalCents = parseAmountToCents(totalValue);

  if (totalCents <= 0) {
    throw new RangeError('total_value must be greater than zero');
  }

  const isBigDeal = totalCents > BIG_DEAL_THRESHOLD_CENTS;
  const rates = isBigDeal ? BIG_DEAL_RATES : SMALL_DEAL_RATES;
  const { taxReserveCents, opsFundCents, ownerSweepCents } = allocateByBasisPoints(
    totalCents,
    rates,
  );

  return {
    tax_reserve: centsToDollars(taxReserveCents),
    ops_fund: centsToDollars(opsFundCents),
    owner_sweep: centsToDollars(ownerSweepCents),
    total_processed: centsToDollars(totalCents),
    status: ownerSweepCents > OWNER_SWEEP_MINIMUM_CENTS
      ? 'READY_FOR_RTP'
      : 'HOLD_IN_BUSINESS_ACCOUNT',
    tier: isBigDeal ? 'over_10000' : 'standard',
    timestamp: now.toISOString(),
  };
}
