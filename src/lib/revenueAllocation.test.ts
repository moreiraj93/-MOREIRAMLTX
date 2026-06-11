import { describe, expect, it } from "vitest";

import { allocateRevenue } from "./revenueAllocation";

const timestamp = new Date("2026-06-11T06:02:35.308Z");

describe("allocateRevenue", () => {
  it("allocates smaller deals with 25% tax, 25% ops, and 50% owner sweep", () => {
    expect(allocateRevenue({ total_value: 1000 }, timestamp)).toEqual({
      tax_reserve: 250,
      ops_fund: 250,
      owner_sweep: 500,
      total_processed: 1000,
      status: "READY_FOR_RTP",
      timestamp: "2026-06-11T06:02:35.308Z",
    });
  });

  it("allocates deals over $10,000 with a larger tax reserve", () => {
    expect(allocateRevenue({ total_value: 12_000 }, timestamp)).toMatchObject({
      tax_reserve: 4200,
      ops_fund: 1800,
      owner_sweep: 6000,
      total_processed: 12000,
      status: "READY_FOR_RTP",
    });
  });

  it("keeps an exact $10,000 deal in the smaller-deal tier", () => {
    expect(allocateRevenue({ total_value: 10_000 }, timestamp)).toMatchObject({
      tax_reserve: 2500,
      ops_fund: 2500,
      owner_sweep: 5000,
      total_processed: 10000,
    });
  });

  it("holds the owner sweep when the sweep amount is $10 or less", () => {
    expect(allocateRevenue({ total_value: 20 }, timestamp)).toMatchObject({
      owner_sweep: 10,
      status: "HOLD_IN_BUSINESS_ACCOUNT",
    });
  });

  it("marks the owner sweep ready when the sweep amount is greater than $10", () => {
    expect(allocateRevenue({ total_value: 20.02 }, timestamp)).toMatchObject({
      owner_sweep: 10.01,
      status: "READY_FOR_RTP",
    });
  });

  it("normalizes string totals and keeps rounded allocations reconciled", () => {
    const result = allocateRevenue({ total_value: "100.01" }, timestamp);

    expect(result).toMatchObject({
      tax_reserve: 25,
      ops_fund: 25,
      owner_sweep: 50.01,
      total_processed: 100.01,
    });

    expect(result.tax_reserve + result.ops_fund + result.owner_sweep).toBeCloseTo(
      result.total_processed,
      2,
    );
  });

  it("rejects negative totals", () => {
    expect(() => allocateRevenue({ total_value: -1 }, timestamp)).toThrow(
      "total_value must be greater than or equal to 0",
    );
  });

  it("rejects non-numeric totals", () => {
    expect(() => allocateRevenue({ total_value: "treasury" }, timestamp)).toThrow(
      "total_value must be a finite number",
    );
  });
});
