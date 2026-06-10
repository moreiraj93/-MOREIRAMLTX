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

const LARGE_DEAL_THRESHOLD_CENTS = 1_000_000;
const OWNER_SWEEP_MINIMUM_CENTS = 1_000;

const SMALL_DEAL_RATES = {
  taxRate: 0.25,
  opsRate: 0.25,
  ownerRate: 0.5,
} as const;

const LARGE_DEAL_RATES = {
  taxRate: 0.35,
  opsRate: 0.15,
  ownerRate: 0.5,
} as const;

const toCents = (value: number): number =>
  Math.round((value + Number.EPSILON) * 100);

const fromCents = (valueInCents: number): number =>
  Number((valueInCents / 100).toFixed(2));

const assertValidTotalValue = (totalValue: number): void => {
  if (!Number.isFinite(totalValue)) {
    throw new Error("total_value must be a finite number");
  }

  if (totalValue < 0) {
    throw new Error("total_value must be zero or greater");
  }
};

const getRates = (totalValueInCents: number) =>
  totalValueInCents > LARGE_DEAL_THRESHOLD_CENTS
    ? LARGE_DEAL_RATES
    : SMALL_DEAL_RATES;

export const allocateRevenue = (
  input: RevenueAllocationInput,
  timestamp: Date = new Date(),
): RevenueAllocationResult => {
  assertValidTotalValue(input.total_value);

  const totalValueInCents = toCents(input.total_value);
  const { taxRate, ownerRate } = getRates(totalValueInCents);

  const taxReserveInCents = Math.round(totalValueInCents * taxRate);
  const ownerSweepInCents = Math.round(totalValueInCents * ownerRate);
  const opsFundInCents =
    totalValueInCents - taxReserveInCents - ownerSweepInCents;

  const ownerSweep = fromCents(ownerSweepInCents);

  return {
    tax_reserve: fromCents(taxReserveInCents),
    ops_fund: fromCents(opsFundInCents),
    owner_sweep: ownerSweep,
    total_processed: fromCents(totalValueInCents),
    status:
      ownerSweepInCents > OWNER_SWEEP_MINIMUM_CENTS
        ? "READY_FOR_RTP"
        : "HOLD_IN_BUSINESS_ACCOUNT",
    timestamp: timestamp.toISOString(),
  };
};
