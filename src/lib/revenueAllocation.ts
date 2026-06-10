export type RevenueAllocationStatus =
  | "READY_FOR_RTP"
  | "HOLD_IN_BUSINESS_ACCOUNT";

export interface RevenueAllocationInput {
  total_value: number;
}

export interface RevenueAllocationResult {
  tax_reserve: number;
  ops_fund: number;
  owner_sweep: number;
  total_processed: number;
  status: RevenueAllocationStatus;
  timestamp: string;
}

interface AllocationRates {
  taxRate: number;
  opsRate: number;
  ownerRate: number;
}

const LARGE_DEAL_THRESHOLD_CENTS = 1_000_000;
const OWNER_SWEEP_MINIMUM_CENTS = 1_000;

const LARGE_DEAL_RATES: AllocationRates = {
  taxRate: 0.35,
  opsRate: 0.15,
  ownerRate: 0.5,
};

const STANDARD_DEAL_RATES: AllocationRates = {
  taxRate: 0.25,
  opsRate: 0.25,
  ownerRate: 0.5,
};

const toCents = (amount: number) => Math.round(amount * 100);
const fromCents = (cents: number) => cents / 100;

const getAllocationRates = (totalCents: number): AllocationRates =>
  totalCents > LARGE_DEAL_THRESHOLD_CENTS
    ? LARGE_DEAL_RATES
    : STANDARD_DEAL_RATES;

export const calculateRevenueAllocation = (
  input: RevenueAllocationInput,
  timestamp = new Date(),
): RevenueAllocationResult => {
  const totalValue = input.total_value;

  if (!Number.isFinite(totalValue) || totalValue < 0) {
    throw new RangeError("total_value must be a finite, non-negative number");
  }

  const totalCents = toCents(totalValue);
  const rates = getAllocationRates(totalCents);

  const taxReserveCents = Math.round(totalCents * rates.taxRate);
  const ownerSweepCents = Math.round(totalCents * rates.ownerRate);
  const opsFundCents = totalCents - taxReserveCents - ownerSweepCents;

  return {
    tax_reserve: fromCents(taxReserveCents),
    ops_fund: fromCents(opsFundCents),
    owner_sweep: fromCents(ownerSweepCents),
    total_processed: fromCents(totalCents),
    status:
      ownerSweepCents > OWNER_SWEEP_MINIMUM_CENTS
        ? "READY_FOR_RTP"
        : "HOLD_IN_BUSINESS_ACCOUNT",
    timestamp: timestamp.toISOString(),
  };
};
