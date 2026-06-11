export type RevenueAllocationStatus =
  | "READY_FOR_RTP"
  | "HOLD_IN_BUSINESS_ACCOUNT";

export type RevenueAllocationInput = {
  total_value: number | string;
};

export type RevenueAllocationResult = {
  tax_reserve: number;
  ops_fund: number;
  owner_sweep: number;
  total_processed: number;
  status: RevenueAllocationStatus;
  timestamp: string;
};

export type RevenueAllocationRates = {
  taxRate: number;
  opsRate: number;
  ownerRate: number;
};

const BIG_DEAL_THRESHOLD_CENTS = 1_000_000;
const OWNER_SWEEP_THRESHOLD_CENTS = 1_000;

export const SMALL_DEAL_RATES: RevenueAllocationRates = {
  taxRate: 0.25,
  opsRate: 0.25,
  ownerRate: 0.5,
};

export const BIG_DEAL_RATES: RevenueAllocationRates = {
  taxRate: 0.35,
  opsRate: 0.15,
  ownerRate: 0.5,
};

function normalizeTotalToCents(totalValue: RevenueAllocationInput["total_value"]) {
  const numericTotal =
    typeof totalValue === "string" && totalValue.trim() !== ""
      ? Number(totalValue.trim())
      : totalValue;

  if (!Number.isFinite(numericTotal)) {
    throw new Error("total_value must be a finite number");
  }

  if (numericTotal < 0) {
    throw new Error("total_value must be greater than or equal to 0");
  }

  return Math.round(numericTotal * 100);
}

function centsToDollars(cents: number) {
  return cents / 100;
}

export function getRevenueAllocationRates(
  totalValue: RevenueAllocationInput["total_value"],
): RevenueAllocationRates {
  const totalCents = normalizeTotalToCents(totalValue);

  return totalCents > BIG_DEAL_THRESHOLD_CENTS
    ? BIG_DEAL_RATES
    : SMALL_DEAL_RATES;
}

export function allocateRevenue(
  input: RevenueAllocationInput,
  now: Date = new Date(),
): RevenueAllocationResult {
  const totalCents = normalizeTotalToCents(input.total_value);
  const rates =
    totalCents > BIG_DEAL_THRESHOLD_CENTS ? BIG_DEAL_RATES : SMALL_DEAL_RATES;

  const taxReserveCents = Math.round(totalCents * rates.taxRate);
  const ownerSweepCents = Math.round(totalCents * rates.ownerRate);
  const opsFundCents = totalCents - taxReserveCents - ownerSweepCents;

  return {
    tax_reserve: centsToDollars(taxReserveCents),
    ops_fund: centsToDollars(opsFundCents),
    owner_sweep: centsToDollars(ownerSweepCents),
    total_processed: centsToDollars(totalCents),
    status:
      ownerSweepCents > OWNER_SWEEP_THRESHOLD_CENTS
        ? "READY_FOR_RTP"
        : "HOLD_IN_BUSINESS_ACCOUNT",
    timestamp: now.toISOString(),
  };
}
