export type RevenueAllocationStatus =
  | "READY_FOR_RTP"
  | "HOLD_IN_BUSINESS_ACCOUNT";

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
  ownerRate: number;
}

const BIG_DEAL_THRESHOLD_CENTS = 1_000_000;
const OWNER_SWEEP_MINIMUM_CENTS = 1_000;

function parseCurrencyCents(totalValue: RevenueAllocationInput["total_value"]): number {
  const normalizedValue =
    typeof totalValue === "string" ? Number(totalValue.trim()) : totalValue;

  if (!Number.isFinite(normalizedValue)) {
    throw new Error("total_value must be a finite number");
  }

  if (normalizedValue < 0) {
    throw new Error("total_value cannot be negative");
  }

  return Math.round(normalizedValue * 100);
}

function centsToDollars(cents: number): number {
  return cents / 100;
}

function ratesForTotal(totalCents: number): AllocationRates {
  if (totalCents > BIG_DEAL_THRESHOLD_CENTS) {
    return {
      taxRate: 0.35,
      ownerRate: 0.5,
    };
  }

  return {
    taxRate: 0.25,
    ownerRate: 0.5,
  };
}

export function allocateRevenue(
  input: RevenueAllocationInput,
  now: Date = new Date(),
): RevenueAllocationResult {
  const totalCents = parseCurrencyCents(input.total_value);
  const { taxRate, ownerRate } = ratesForTotal(totalCents);

  const taxReserveCents = Math.round(totalCents * taxRate);
  const ownerSweepCents = Math.round(totalCents * ownerRate);
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
    timestamp: now.toISOString(),
  };
}
