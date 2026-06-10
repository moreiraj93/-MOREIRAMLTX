import { describe, expect, it } from "vitest";

import { allocateRevenue } from "./revenueAllocation";

const fixedNow = new Date("2026-06-10T17:01:06.810Z");

describe("allocateRevenue", () => {
  it("allocates smaller deals evenly across tax and ops with a 50% owner sweep", () => {
    expect(allocateRevenue({ total_value: 8_000 }, fixedNow)).toEqual({
      tax_reserve: 2_000,
      ops_fund: 2_000,
      owner_sweep: 4_000,
      total_processed: 8_000,
      status: "READY_FOR_RTP",
      timestamp: "2026-06-10T17:01:06.810Z",
    });
  });

  it("uses the larger tax reserve tier only when the deal is over $10,000", () => {
    expect(allocateRevenue({ total_value: 10_000 }, fixedNow)).toMatchObject({
      tax_reserve: 2_500,
      ops_fund: 2_500,
      owner_sweep: 5_000,
    });

    expect(allocateRevenue({ total_value: 10_000.01 }, fixedNow)).toMatchObject({
      tax_reserve: 3_500,
      ops_fund: 1_500,
      owner_sweep: 5_000.01,
    });
  });

  it("holds owner sweeps that do not clear the $10 safety threshold", () => {
    expect(allocateRevenue({ total_value: 20 }, fixedNow).status).toBe(
      "HOLD_IN_BUSINESS_ACCOUNT",
    );
    expect(allocateRevenue({ total_value: 20.02 }, fixedNow).status).toBe(
      "READY_FOR_RTP",
    );
  });

  it("rounds to cents while keeping the full allocation reconciled to the total", () => {
    const result = allocateRevenue({ total_value: "0.05" }, fixedNow);
    const allocatedTotal = result.tax_reserve + result.ops_fund + result.owner_sweep;

    expect(result).toMatchObject({
      tax_reserve: 0.01,
      ops_fund: 0.01,
      owner_sweep: 0.03,
      total_processed: 0.05,
    });
    expect(allocatedTotal).toBe(result.total_processed);
  });

  it("rejects invalid total values before creating transfer instructions", () => {
    expect(() => allocateRevenue({ total_value: Number.NaN }, fixedNow)).toThrow(
      "total_value must be a finite number",
    );
    expect(() => allocateRevenue({ total_value: -1 }, fixedNow)).toThrow(
      "total_value cannot be negative",
    );
  });
});
