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

const HIGH_VALUE_DEAL_THRESHOLD = 10_000;
const MIN_OWNER_SWEEP_CENTS = 1_000;

const SMALL_DEAL_RATES: AllocationRates = {
  taxRate: 0.25,
  opsRate: 0.25,
  ownerRate: 0.5,
};

const HIGH_VALUE_DEAL_RATES: AllocationRates = {
  taxRate: 0.35,
  opsRate: 0.15,
  ownerRate: 0.5,
};

function toCents(value: number): number {
  return Math.round((value + Number.EPSILON) * 100);
}

function fromCents(cents: number): number {
  return cents / 100;
}

function ratesForTotal(totalValue: number): AllocationRates {
  return totalValue > HIGH_VALUE_DEAL_THRESHOLD
    ? HIGH_VALUE_DEAL_RATES
    : SMALL_DEAL_RATES;
}

export function allocateRevenue(
  input: RevenueAllocationInput,
  now: Date = new Date(),
): RevenueAllocationResult {
  const totalValue = input.total_value;

  if (!Number.isFinite(totalValue) || totalValue < 0) {
    throw new Error("total_value must be a non-negative finite number");
  }

  const totalCents = toCents(totalValue);
  const { taxRate, ownerRate } = ratesForTotal(fromCents(totalCents));
  const taxReserveCents = Math.round(totalCents * taxRate);
  const ownerSweepCents = Math.round(totalCents * ownerRate);
  const opsFundCents = totalCents - taxReserveCents - ownerSweepCents;

  return {
    tax_reserve: fromCents(taxReserveCents),
    ops_fund: fromCents(opsFundCents),
    owner_sweep: fromCents(ownerSweepCents),
    total_processed: fromCents(totalCents),
    status:
      ownerSweepCents > MIN_OWNER_SWEEP_CENTS
        ? "READY_FOR_RTP"
        : "HOLD_IN_BUSINESS_ACCOUNT",
    timestamp: now.toISOString(),
  };
}
