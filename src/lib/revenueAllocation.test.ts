import { describe, expect, it } from "vitest";

import { allocateRevenue, getRevenueAllocationRates } from "./revenueAllocation";

const FIXED_DATE = new Date("2026-06-11T08:04:00.000Z");

describe("revenue allocation", () => {
  it("allocates smaller deals with 25% tax, 25% ops, and 50% owner sweep", () => {
    expect(allocateRevenue({ total_value: 1_000 }, FIXED_DATE)).toEqual({
      tax_reserve: 250,
      ops_fund: 250,
      owner_sweep: 500,
      total_processed: 1_000,
      status: "READY_FOR_RTP",
      timestamp: "2026-06-11T08:04:00.000Z",
    });
  });

  it("allocates deals over $10,000 with the big-deal reserve rates", () => {
    expect(allocateRevenue({ total_value: 12_000 }, FIXED_DATE)).toEqual({
      tax_reserve: 4_200,
      ops_fund: 1_800,
      owner_sweep: 6_000,
      total_processed: 12_000,
      status: "READY_FOR_RTP",
      timestamp: "2026-06-11T08:04:00.000Z",
    });
  });

  it("uses the smaller-deal rates at exactly $10,000", () => {
    expect(getRevenueAllocationRates(10_000)).toEqual({
      taxRate: 0.25,
      opsRate: 0.25,
      ownerRate: 0.5,
    });
  });

  it("holds owner sweeps of $10.00 or less in the business account", () => {
    expect(allocateRevenue({ total_value: 20 }, FIXED_DATE).status).toBe(
      "HOLD_IN_BUSINESS_ACCOUNT",
    );
    expect(allocateRevenue({ total_value: 20.02 }, FIXED_DATE).status).toBe(
      "READY_FOR_RTP",
    );
  });

  it("normalizes to cents and reconciles penny rounding through the ops fund", () => {
    const result = allocateRevenue({ total_value: 10_000.01 }, FIXED_DATE);

    expect(result).toMatchObject({
      tax_reserve: 3_500,
      ops_fund: 1_500,
      owner_sweep: 5_000.01,
      total_processed: 10_000.01,
    });
    expect(result.tax_reserve + result.ops_fund + result.owner_sweep).toBe(
      result.total_processed,
    );
  });

  it("rejects invalid totals before generating banking output", () => {
    expect(() => allocateRevenue({ total_value: -1 }, FIXED_DATE)).toThrow(
      "total_value must be a non-negative finite number",
    );
    expect(() =>
      allocateRevenue({ total_value: Number.POSITIVE_INFINITY }, FIXED_DATE),
    ).toThrow("total_value must be a non-negative finite number");
  });
});
