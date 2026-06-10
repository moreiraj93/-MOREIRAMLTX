import { describe, expect, it } from "vitest";
import { allocateRevenue } from "./revenueAllocation";

const fixedNow = new Date("2026-06-10T18:00:45.445Z");

describe("allocateRevenue", () => {
  it("allocates smaller deals into 25% tax, 25% ops, and 50% owner sweep", () => {
    expect(allocateRevenue({ total_value: 1_000 }, fixedNow)).toEqual({
      tax_reserve: 250,
      ops_fund: 250,
      owner_sweep: 500,
      total_processed: 1_000,
      status: "READY_FOR_RTP",
      timestamp: "2026-06-10T18:00:45.445Z",
    });
  });

  it("allocates deals over $10,000 into the high-value tax reserve tier", () => {
    expect(allocateRevenue({ total_value: 12_000 }, fixedNow)).toEqual({
      tax_reserve: 4_200,
      ops_fund: 1_800,
      owner_sweep: 6_000,
      total_processed: 12_000,
      status: "READY_FOR_RTP",
      timestamp: "2026-06-10T18:00:45.445Z",
    });
  });

  it("keeps $10,000 in the smaller deal tier", () => {
    expect(allocateRevenue({ total_value: 10_000 }, fixedNow)).toMatchObject({
      tax_reserve: 2_500,
      ops_fund: 2_500,
      owner_sweep: 5_000,
    });
  });

  it("holds the sweep when the owner allocation is not more than $10", () => {
    expect(allocateRevenue({ total_value: 20 }, fixedNow)).toMatchObject({
      owner_sweep: 10,
      status: "HOLD_IN_BUSINESS_ACCOUNT",
    });

    expect(allocateRevenue({ total_value: 20.02 }, fixedNow)).toMatchObject({
      owner_sweep: 10.01,
      status: "READY_FOR_RTP",
    });
  });

  it("normalizes to cents and keeps allocations reconciled to the processed total", () => {
    const result = allocateRevenue({ total_value: 100.005 }, fixedNow);

    expect(result).toMatchObject({
      tax_reserve: 25,
      ops_fund: 25,
      owner_sweep: 50.01,
      total_processed: 100.01,
    });
    expect(result.tax_reserve + result.ops_fund + result.owner_sweep).toBe(
      result.total_processed,
    );
  });

  it("rejects totals that cannot safely be allocated", () => {
    expect(() => allocateRevenue({ total_value: -1 }, fixedNow)).toThrow(
      "total_value must be a non-negative finite number",
    );
    expect(() => allocateRevenue({ total_value: Number.NaN }, fixedNow)).toThrow(
      "total_value must be a non-negative finite number",
    );
  });
});
