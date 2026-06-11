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

interface RevenueAllocationRates {
  taxRate: number;
  opsRate: number;
  ownerRate: number;
}

const BIG_DEAL_THRESHOLD_CENTS = 1_000_000;
const OWNER_SWEEP_MINIMUM_CENTS = 1_000;
const CENTS_PER_DOLLAR = 100;

const STANDARD_DEAL_RATES: RevenueAllocationRates = {
  taxRate: 0.25,
  opsRate: 0.25,
  ownerRate: 0.5,
};

const BIG_DEAL_RATES: RevenueAllocationRates = {
  taxRate: 0.35,
  opsRate: 0.15,
  ownerRate: 0.5,
};

const toCents = (value: number): number => Math.round(value * CENTS_PER_DOLLAR);

const toDollars = (cents: number): number => cents / CENTS_PER_DOLLAR;

export const getRevenueAllocationRates = (
  totalValue: number,
): RevenueAllocationRates => {
  const totalCents = toCents(totalValue);

  return totalCents > BIG_DEAL_THRESHOLD_CENTS
    ? BIG_DEAL_RATES
    : STANDARD_DEAL_RATES;
};

export const allocateRevenue = (
  input: RevenueAllocationInput,
  now: Date = new Date(),
): RevenueAllocationResult => {
  if (!Number.isFinite(input.total_value) || input.total_value < 0) {
    throw new Error("total_value must be a non-negative finite number");
  }

  const totalCents = toCents(input.total_value);
  const rates = getRevenueAllocationRates(input.total_value);
  const taxReserveCents = Math.round(totalCents * rates.taxRate);
  const ownerSweepCents = Math.round(totalCents * rates.ownerRate);
  const opsFundCents = totalCents - taxReserveCents - ownerSweepCents;

  return {
    tax_reserve: toDollars(taxReserveCents),
    ops_fund: toDollars(opsFundCents),
    owner_sweep: toDollars(ownerSweepCents),
    total_processed: toDollars(totalCents),
    status:
      ownerSweepCents > OWNER_SWEEP_MINIMUM_CENTS
        ? "READY_FOR_RTP"
        : "HOLD_IN_BUSINESS_ACCOUNT",
    timestamp: now.toISOString(),
  };
};
