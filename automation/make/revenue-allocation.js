const LARGE_DEAL_THRESHOLD = 10000;
const OWNER_SWEEP_READY_THRESHOLD = 10;
const BASIS_POINTS = 10000;
const CENTS_PER_DOLLAR = 100;

const SMALL_DEAL_RATES = {
  taxBasisPoints: 2500,
  ownerBasisPoints: 5000,
};

const LARGE_DEAL_RATES = {
  taxBasisPoints: 3500,
  ownerBasisPoints: 5000,
};

const toCents = (amount) => Math.round(amount * CENTS_PER_DOLLAR);
const fromCents = (amountInCents) => amountInCents / CENTS_PER_DOLLAR;
const allocateByBasisPoints = (totalCents, basisPoints) =>
  Math.round((totalCents * basisPoints) / BASIS_POINTS);

const totalValue = Number(input.total_value);

if (!Number.isFinite(totalValue)) {
  throw new Error("input.total_value must be a finite number");
}

if (totalValue < 0) {
  throw new Error("input.total_value must be greater than or equal to zero");
}

const totalCents = toCents(totalValue);
const totalProcessed = fromCents(totalCents);
const rates =
  totalProcessed > LARGE_DEAL_THRESHOLD ? LARGE_DEAL_RATES : SMALL_DEAL_RATES;

const taxReserveCents = allocateByBasisPoints(
  totalCents,
  rates.taxBasisPoints,
);
const ownerSweepCents = allocateByBasisPoints(
  totalCents,
  rates.ownerBasisPoints,
);
const opsFundCents = totalCents - taxReserveCents - ownerSweepCents;

const ownerSweep = fromCents(ownerSweepCents);

return {
  tax_reserve: fromCents(taxReserveCents),
  ops_fund: fromCents(opsFundCents),
  owner_sweep: ownerSweep,
  total_processed: totalProcessed,
  status:
    ownerSweep > OWNER_SWEEP_READY_THRESHOLD
      ? "READY_FOR_RTP"
      : "HOLD_IN_BUSINESS_ACCOUNT",
  timestamp: new Date().toISOString(),
};
