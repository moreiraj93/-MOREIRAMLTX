import { describe, expect, it } from "vitest";

import { calculateRevenueAllocation } from "./revenueAllocation";

const timestamp = new Date("2026-06-10T23:00:25.282Z");

describe("calculateRevenueAllocation", () => {
  it("uses standard allocation rates for deals at or below $10,000", () => {
    expect(
      calculateRevenueAllocation({ total_value: 10_000 }, timestamp),
    ).toEqual({
      tax_reserve: 2_500,
      ops_fund: 2_500,
      owner_sweep: 5_000,
      total_processed: 10_000,
      status: "READY_FOR_RTP",
      timestamp: "2026-06-10T23:00:25.282Z",
    });
  });

  it("uses large deal allocation rates for deals over $10,000", () => {
    expect(
      calculateRevenueAllocation({ total_value: 12_500 }, timestamp),
    ).toEqual({
      tax_reserve: 4_375,
      ops_fund: 1_875,
      owner_sweep: 6_250,
      total_processed: 12_500,
      status: "READY_FOR_RTP",
      timestamp: "2026-06-10T23:00:25.282Z",
    });
  });

  it("holds funds when the owner sweep is $10 or less", () => {
    expect(
      calculateRevenueAllocation({ total_value: 20 }, timestamp).status,
    ).toBe("HOLD_IN_BUSINESS_ACCOUNT");
  });

  it("marks funds ready when the owner sweep is more than $10", () => {
    expect(
      calculateRevenueAllocation({ total_value: 20.02 }, timestamp).status,
    ).toBe("READY_FOR_RTP");
  });

  it("keeps rounded allocations reconciled to the processed total", () => {
    const result = calculateRevenueAllocation({ total_value: 100.01 }, timestamp);

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

  it("rejects invalid totals", () => {
    expect(() =>
      calculateRevenueAllocation({ total_value: Number.NaN }, timestamp),
    ).toThrow("total_value must be a finite, non-negative number");
    expect(() =>
      calculateRevenueAllocation({ total_value: -1 }, timestamp),
    ).toThrow("total_value must be a finite, non-negative number");
  });
});
