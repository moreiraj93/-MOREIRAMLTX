export type RevenueAllocationStatus =
  | "READY_FOR_RTP"
  | "HOLD_IN_BUSINESS_ACCOUNT";

export interface RevenueAllocationInput {
  total_value: number;
}

export interface RevenueAllocationOutput {
  tax_reserve: number;
  ops_fund: number;
  owner_sweep: number;
  total_processed: number;
  status: RevenueAllocationStatus;
  timestamp: string;
}

interface AllocationTier {
  taxRate: number;
  opsRate: number;
  ownerRate: number;
}

const HIGH_VALUE_THRESHOLD = 10_000;
const OWNER_SWEEP_THRESHOLD = 10;

const SMALL_DEAL_TIER: AllocationTier = {
  taxRate: 0.25,
  opsRate: 0.25,
  ownerRate: 0.5,
};

const LARGE_DEAL_TIER: AllocationTier = {
  taxRate: 0.35,
  opsRate: 0.15,
  ownerRate: 0.5,
};

const dollarsToCents = (value: number) => Math.round(value * 100);
const centsToDollars = (cents: number) => Number((cents / 100).toFixed(2));

const getAllocationTier = (totalValue: number): AllocationTier => {
  return totalValue > HIGH_VALUE_THRESHOLD ? LARGE_DEAL_TIER : SMALL_DEAL_TIER;
};

const assertValidTotalValue = (totalValue: number) => {
  if (!Number.isFinite(totalValue) || totalValue < 0) {
    throw new Error("total_value must be a finite, non-negative number");
  }
};

export const allocateRevenue = (
  input: RevenueAllocationInput,
  now: Date = new Date()
): RevenueAllocationOutput => {
  const totalValue = input.total_value;
  assertValidTotalValue(totalValue);

  const totalCents = dollarsToCents(totalValue);
  const tier = getAllocationTier(totalValue);

  const taxReserveCents = Math.round(totalCents * tier.taxRate);
  const ownerSweepCents = Math.round(totalCents * tier.ownerRate);
  const opsFundCents = totalCents - taxReserveCents - ownerSweepCents;
  const ownerSweep = centsToDollars(ownerSweepCents);

  return {
    tax_reserve: centsToDollars(taxReserveCents),
    ops_fund: centsToDollars(opsFundCents),
    owner_sweep: ownerSweep,
    total_processed: centsToDollars(totalCents),
    status:
      ownerSweep > OWNER_SWEEP_THRESHOLD
        ? "READY_FOR_RTP"
        : "HOLD_IN_BUSINESS_ACCOUNT",
    timestamp: now.toISOString(),
  };
};

