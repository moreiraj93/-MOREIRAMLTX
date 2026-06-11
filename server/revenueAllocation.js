const LARGE_DEAL_THRESHOLD_CENTS = 1_000_000;
const OWNER_SWEEP_THRESHOLD_CENTS = 1_000;

const SMALL_DEAL_RATES_BPS = {
  taxReserve: 2500,
  opsFund: 2500,
  ownerSweep: 5000,
};

const LARGE_DEAL_RATES_BPS = {
  taxReserve: 3500,
  opsFund: 1500,
  ownerSweep: 5000,
};

function parseCurrencyToCents(value) {
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

function centsToCurrency(cents) {
  return Number((cents / 100).toFixed(2));
}

function allocateByBasisPoints(totalCents, rates) {
  const taxReserveCents = Math.round((totalCents * rates.taxReserve) / 10_000);
  const opsFundCents = Math.round((totalCents * rates.opsFund) / 10_000);
  const ownerSweepCents = totalCents - taxReserveCents - opsFundCents;

  return {
    taxReserveCents,
    opsFundCents,
    ownerSweepCents,
  };
}

export function calculateRevenueAllocation(input, now = new Date()) {
  const totalCents = parseCurrencyToCents(input?.total_value);

  if (totalCents <= 0) {
    throw new RangeError('total_value must be greater than zero');
  }

  const rates =
    totalCents > LARGE_DEAL_THRESHOLD_CENTS ? LARGE_DEAL_RATES_BPS : SMALL_DEAL_RATES_BPS;
  const { taxReserveCents, opsFundCents, ownerSweepCents } = allocateByBasisPoints(
    totalCents,
    rates,
  );

  return {
    tax_reserve: centsToCurrency(taxReserveCents),
    ops_fund: centsToCurrency(opsFundCents),
    owner_sweep: centsToCurrency(ownerSweepCents),
    total_processed: centsToCurrency(totalCents),
    status:
      ownerSweepCents > OWNER_SWEEP_THRESHOLD_CENTS
        ? 'READY_FOR_RTP'
        : 'HOLD_IN_BUSINESS_ACCOUNT',
    timestamp: now.toISOString(),
  };
}
