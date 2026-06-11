import { describe, expect, it } from "vitest";

import { allocateRevenue } from "./revenueAllocation";

describe("allocateRevenue", () => {
  it("allocates smaller deals to 25% tax, 25% ops, and 50% owner sweep", () => {
    const allocation = allocateRevenue(1_000);

    expect(allocation).toMatchObject({
      tax_reserve: 250,
      ops_fund: 250,
      owner_sweep: 500,
      total_processed: 1_000,
      status: "READY_FOR_RTP",
    });
    expect(new Date(allocation.timestamp).toISOString()).toBe(
      allocation.timestamp,
    );
  });

  it("uses the smaller-deal tier at the 10000 boundary", () => {
    const allocation = allocateRevenue(10_000);

    expect(allocation.tax_reserve).toBe(2_500);
    expect(allocation.ops_fund).toBe(2_500);
    expect(allocation.owner_sweep).toBe(5_000);
  });

  it("allocates deals over 10000 to 35% tax, 15% ops, and 50% owner sweep", () => {
    const allocation = allocateRevenue(12_000);

    expect(allocation).toMatchObject({
      tax_reserve: 4_200,
      ops_fund: 1_800,
      owner_sweep: 6_000,
      total_processed: 12_000,
      status: "READY_FOR_RTP",
    });
  });

  it("holds owner sweeps of exactly 10 dollars", () => {
    const allocation = allocateRevenue(20);

    expect(allocation.owner_sweep).toBe(10);
    expect(allocation.status).toBe("HOLD_IN_BUSINESS_ACCOUNT");
  });

  it("marks owner sweeps greater than 10 dollars as ready for RTP", () => {
    const allocation = allocateRevenue(20.01);

    expect(allocation.owner_sweep).toBe(10.01);
    expect(allocation.status).toBe("READY_FOR_RTP");
  });

  it("normalizes money to cents and reconciles the allocation total", () => {
    const allocation = allocateRevenue(0.05);

    expect(allocation).toMatchObject({
      tax_reserve: 0.01,
      ops_fund: 0.01,
      owner_sweep: 0.03,
      total_processed: 0.05,
      status: "HOLD_IN_BUSINESS_ACCOUNT",
    });

    expect(
      allocation.tax_reserve + allocation.ops_fund + allocation.owner_sweep,
    ).toBe(allocation.total_processed);
  });

  it("rejects negative totals", () => {
    expect(() => allocateRevenue(-1)).toThrow(
      "totalValue must be greater than or equal to zero",
    );
  });

  it("rejects non-finite totals", () => {
    expect(() => allocateRevenue(Number.NaN)).toThrow(
      "totalValue must be a finite number",
    );
    expect(() => allocateRevenue(Number.POSITIVE_INFINITY)).toThrow(
      "totalValue must be a finite number",
    );
  });
});
