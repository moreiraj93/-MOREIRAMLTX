export type RevenueAllocationStatus =
  | "READY_FOR_RTP"
  | "HOLD_IN_BUSINESS_ACCOUNT";

export interface RevenueAllocation {
  tax_reserve: number;
  ops_fund: number;
  owner_sweep: number;
  total_processed: number;
  status: RevenueAllocationStatus;
  timestamp: string;
}

interface AllocationRates {
  taxBasisPoints: number;
  ownerBasisPoints: number;
}

const LARGE_DEAL_THRESHOLD = 10_000;
const OWNER_SWEEP_READY_THRESHOLD = 10;

const SMALL_DEAL_RATES: AllocationRates = {
  taxBasisPoints: 2_500,
  ownerBasisPoints: 5_000,
};

const LARGE_DEAL_RATES: AllocationRates = {
  taxBasisPoints: 3_500,
  ownerBasisPoints: 5_000,
};

const BASIS_POINTS = 10_000;
const CENTS_PER_DOLLAR = 100;

const toCents = (amount: number): number =>
  Math.round(amount * CENTS_PER_DOLLAR);

const fromCents = (amountInCents: number): number =>
  amountInCents / CENTS_PER_DOLLAR;

const allocateByBasisPoints = (
  totalCents: number,
  basisPoints: number,
): number => Math.round((totalCents * basisPoints) / BASIS_POINTS);

const getAllocationRates = (totalValue: number): AllocationRates =>
  totalValue > LARGE_DEAL_THRESHOLD ? LARGE_DEAL_RATES : SMALL_DEAL_RATES;

export function allocateRevenue(totalValue: number): RevenueAllocation {
  if (!Number.isFinite(totalValue)) {
    throw new Error("totalValue must be a finite number");
  }

  if (totalValue < 0) {
    throw new Error("totalValue must be greater than or equal to zero");
  }

  const totalCents = toCents(totalValue);
  const totalProcessed = fromCents(totalCents);
  const rates = getAllocationRates(totalProcessed);

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
}
