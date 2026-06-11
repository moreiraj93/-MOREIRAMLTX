export type RevenueAllocationStatus = "READY_FOR_RTP" | "HOLD_IN_BUSINESS_ACCOUNT";

export interface RevenueAllocationInput {
  total_value: number | string;
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

const BIG_DEAL_THRESHOLD_CENTS = 1_000_000;
const OWNER_SWEEP_MINIMUM_CENTS = 1_000;

const SMALL_DEAL_RATES: AllocationRates = {
  taxRate: 0.25,
  opsRate: 0.25,
  ownerRate: 0.5,
};

const BIG_DEAL_RATES: AllocationRates = {
  taxRate: 0.35,
  opsRate: 0.15,
  ownerRate: 0.5,
};

function normalizeToCents(value: RevenueAllocationInput["total_value"]): number {
  const parsedValue = typeof value === "string" ? Number(value.trim()) : value;

  if (!Number.isFinite(parsedValue)) {
    throw new TypeError("total_value must be a finite number");
  }

  if (parsedValue < 0) {
    throw new RangeError("total_value must be greater than or equal to 0");
  }

  return Math.round((parsedValue + Number.EPSILON) * 100);
}

function centsToDollars(cents: number): number {
  return Number((cents / 100).toFixed(2));
}

function ratesForTotal(totalCents: number): AllocationRates {
  return totalCents > BIG_DEAL_THRESHOLD_CENTS ? BIG_DEAL_RATES : SMALL_DEAL_RATES;
}

function calculateShare(totalCents: number, rate: number): number {
  return Math.round(totalCents * rate);
}

export function allocateRevenue(
  input: RevenueAllocationInput,
  timestamp: Date = new Date(),
): RevenueAllocationResult {
  const totalCents = normalizeToCents(input.total_value);
  const rates = ratesForTotal(totalCents);

  const taxReserveCents = calculateShare(totalCents, rates.taxRate);
  const ownerSweepCents = calculateShare(totalCents, rates.ownerRate);
  const opsFundCents = totalCents - taxReserveCents - ownerSweepCents;

  return {
    tax_reserve: centsToDollars(taxReserveCents),
    ops_fund: centsToDollars(opsFundCents),
    owner_sweep: centsToDollars(ownerSweepCents),
    total_processed: centsToDollars(totalCents),
    status:
      ownerSweepCents > OWNER_SWEEP_MINIMUM_CENTS
        ? "READY_FOR_RTP"
        : "HOLD_IN_BUSINESS_ACCOUNT",
    timestamp: timestamp.toISOString(),
  };
}
