export type AllocationStatus = "READY_FOR_RTP" | "HOLD_IN_BUSINESS_ACCOUNT";

export interface RevenueAllocationInput {
  total_value: number | string;
}

export interface RevenueAllocationResult {
  tax_reserve: number;
  ops_fund: number;
  owner_sweep: number;
  total_processed: number;
  status: AllocationStatus;
  timestamp: string;
}

const HIGH_VALUE_THRESHOLD = 10_000;
const READY_FOR_RTP_THRESHOLD = 10;

const parseTotalValue = (totalValue: number | string): number => {
  const parsedValue = typeof totalValue === "string" ? Number(totalValue) : totalValue;

  if (!Number.isFinite(parsedValue)) {
    throw new Error("total_value must be a finite number");
  }

  if (parsedValue < 0) {
    throw new Error("total_value must be greater than or equal to 0");
  }

  return parsedValue;
};

const roundToCents = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100;

export const allocateRevenue = (
  input: RevenueAllocationInput,
  now: () => Date = () => new Date()
): RevenueAllocationResult => {
  const totalValue = parseTotalValue(input.total_value);
  const isHighValueDeal = totalValue > HIGH_VALUE_THRESHOLD;

  const taxRate = isHighValueDeal ? 0.35 : 0.25;
  const opsRate = isHighValueDeal ? 0.15 : 0.25;
  const ownerRate = 0.5;

  const ownerSweep = roundToCents(totalValue * ownerRate);

  return {
    tax_reserve: roundToCents(totalValue * taxRate),
    ops_fund: roundToCents(totalValue * opsRate),
    owner_sweep: ownerSweep,
    total_processed: totalValue,
    status: ownerSweep > READY_FOR_RTP_THRESHOLD ? "READY_FOR_RTP" : "HOLD_IN_BUSINESS_ACCOUNT",
    timestamp: now().toISOString(),
  };
};
