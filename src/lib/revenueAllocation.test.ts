import { describe, expect, it } from "vitest";

import { allocateRevenue } from "./revenueAllocation";

const fixedNow = new Date("2026-06-10T21:00:00.000Z");

describe("allocateRevenue", () => {
  it("allocates smaller deals with 25% tax, 25% ops, and 50% owner sweep", () => {
    expect(allocateRevenue({ total_value: 8_000 }, fixedNow)).toEqual({
      tax_reserve: 2_000,
      ops_fund: 2_000,
      owner_sweep: 4_000,
      total_processed: 8_000,
      status: "READY_FOR_RTP",
      timestamp: "2026-06-10T21:00:00.000Z",
    });
  });

  it("keeps the $10,000 boundary in the smaller-deal tier", () => {
    expect(allocateRevenue({ total_value: 10_000 }, fixedNow)).toMatchObject({
      tax_reserve: 2_500,
      ops_fund: 2_500,
      owner_sweep: 5_000,
      total_processed: 10_000,
      status: "READY_FOR_RTP",
    });
  });

  it("allocates deals over $10,000 with 35% tax, 15% ops, and 50% owner sweep", () => {
    expect(allocateRevenue({ total_value: 12_000 }, fixedNow)).toMatchObject({
      tax_reserve: 4_200,
      ops_fund: 1_800,
      owner_sweep: 6_000,
      total_processed: 12_000,
      status: "READY_FOR_RTP",
    });
  });

  it("holds owner sweeps that are not greater than $10", () => {
    expect(allocateRevenue({ total_value: 20 }, fixedNow)).toMatchObject({
      tax_reserve: 5,
      ops_fund: 5,
      owner_sweep: 10,
      total_processed: 20,
      status: "HOLD_IN_BUSINESS_ACCOUNT",
    });
  });

  it("rounds to cents and reconciles allocations to the processed total", () => {
    const allocation = allocateRevenue({ total_value: 100.01 }, fixedNow);

    expect(allocation).toMatchObject({
      tax_reserve: 25,
      ops_fund: 25,
      owner_sweep: 50.01,
      total_processed: 100.01,
      status: "READY_FOR_RTP",
    });

    expect(
      allocation.tax_reserve + allocation.ops_fund + allocation.owner_sweep
    ).toBeCloseTo(allocation.total_processed, 2);
  });

  it("rejects invalid total values before producing banking instructions", () => {
    expect(() => allocateRevenue({ total_value: Number.NaN }, fixedNow)).toThrow(
      "total_value must be a finite, non-negative number"
    );
    expect(() => allocateRevenue({ total_value: -1 }, fixedNow)).toThrow(
      "total_value must be a finite, non-negative number"
    );
  });
});

