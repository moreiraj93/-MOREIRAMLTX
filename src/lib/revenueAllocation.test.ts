import { describe, expect, it } from "vitest";

import {
  allocateRevenue,
  getRevenueAllocationRates,
} from "./revenueAllocation";

const fixedNow = new Date("2026-06-11T00:00:00.000Z");

describe("allocateRevenue", () => {
  it("allocates smaller deals across tax, ops, and owner sweep", () => {
    expect(allocateRevenue({ total_value: 1000 }, fixedNow)).toEqual({
      tax_reserve: 250,
      ops_fund: 250,
      owner_sweep: 500,
      total_processed: 1000,
      status: "READY_FOR_RTP",
      timestamp: "2026-06-11T00:00:00.000Z",
    });
  });

  it("uses the larger tax reserve tier above $10,000", () => {
    expect(allocateRevenue({ total_value: 20000 }, fixedNow)).toEqual({
      tax_reserve: 7000,
      ops_fund: 3000,
      owner_sweep: 10000,
      total_processed: 20000,
      status: "READY_FOR_RTP",
      timestamp: "2026-06-11T00:00:00.000Z",
    });
  });

  it("keeps the exact $10,000 threshold in the smaller deal tier", () => {
    expect(getRevenueAllocationRates(10000)).toEqual({
      taxRate: 0.25,
      opsRate: 0.25,
      ownerRate: 0.5,
    });
  });

  it("moves one cent above $10,000 into the larger deal tier", () => {
    expect(allocateRevenue({ total_value: 10000.01 }, fixedNow)).toEqual({
      tax_reserve: 3500,
      ops_fund: 1500,
      owner_sweep: 5000.01,
      total_processed: 10000.01,
      status: "READY_FOR_RTP",
      timestamp: "2026-06-11T00:00:00.000Z",
    });
  });

  it("holds owner sweeps of $10 or less in the business account", () => {
    expect(allocateRevenue({ total_value: 20 }, fixedNow).status).toBe(
      "HOLD_IN_BUSINESS_ACCOUNT",
    );
    expect(allocateRevenue({ total_value: 20.02 }, fixedNow).status).toBe(
      "READY_FOR_RTP",
    );
  });

  it("accepts numeric strings from automation inputs", () => {
    expect(allocateRevenue({ total_value: "125.50" }, fixedNow)).toMatchObject({
      tax_reserve: 31.38,
      ops_fund: 31.37,
      owner_sweep: 62.75,
      total_processed: 125.5,
    });
  });

  it("reconciles rounded bags to the processed total", () => {
    const allocation = allocateRevenue({ total_value: 0.05 }, fixedNow);

    expect(
      allocation.tax_reserve + allocation.ops_fund + allocation.owner_sweep,
    ).toBe(allocation.total_processed);
  });

  it("rejects invalid totals", () => {
    expect(() => allocateRevenue({ total_value: "" }, fixedNow)).toThrow(
      "total_value must be a finite number",
    );
    expect(() => allocateRevenue({ total_value: -1 }, fixedNow)).toThrow(
      "total_value must be greater than or equal to 0",
    );
  });
});
