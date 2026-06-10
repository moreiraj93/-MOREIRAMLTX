import { describe, expect, it } from "vitest";
import { allocateRevenue } from "./revenueAllocation";

const fixedTimestamp = new Date("2026-06-10T22:01:26.394Z");

describe("allocateRevenue", () => {
  it("allocates smaller deals into tax, ops, and owner buckets", () => {
    expect(allocateRevenue({ total_value: 1_000 }, fixedTimestamp)).toEqual({
      tax_reserve: 250,
      ops_fund: 250,
      owner_sweep: 500,
      total_processed: 1_000,
      status: "READY_FOR_RTP",
      timestamp: "2026-06-10T22:01:26.394Z",
    });
  });

  it("allocates deals over $10,000 with the larger tax reserve", () => {
    expect(allocateRevenue({ total_value: 12_000 }, fixedTimestamp)).toEqual({
      tax_reserve: 4_200,
      ops_fund: 1_800,
      owner_sweep: 6_000,
      total_processed: 12_000,
      status: "READY_FOR_RTP",
      timestamp: "2026-06-10T22:01:26.394Z",
    });
  });

  it("keeps the $10,000 boundary in the smaller-deal tier", () => {
    expect(allocateRevenue({ total_value: 10_000 }, fixedTimestamp)).toMatchObject({
      tax_reserve: 2_500,
      ops_fund: 2_500,
      owner_sweep: 5_000,
      total_processed: 10_000,
      status: "READY_FOR_RTP",
    });
  });

  it("holds owner sweeps of $10 or less in the business account", () => {
    expect(allocateRevenue({ total_value: 20 }, fixedTimestamp)).toMatchObject({
      tax_reserve: 5,
      ops_fund: 5,
      owner_sweep: 10,
      status: "HOLD_IN_BUSINESS_ACCOUNT",
    });
  });

  it("marks owner sweeps above $10 ready for RTP", () => {
    expect(allocateRevenue({ total_value: 20.02 }, fixedTimestamp)).toMatchObject({
      tax_reserve: 5.01,
      ops_fund: 5,
      owner_sweep: 10.01,
      total_processed: 20.02,
      status: "READY_FOR_RTP",
    });
  });

  it("keeps rounded allocation buckets reconciled to the processed total", () => {
    const allocation = allocateRevenue({ total_value: 0.01 }, fixedTimestamp);
    const allocatedTotal =
      allocation.tax_reserve + allocation.ops_fund + allocation.owner_sweep;

    expect(allocatedTotal).toBe(allocation.total_processed);
  });

  it("rejects invalid totals", () => {
    expect(() =>
      allocateRevenue({ total_value: Number.NaN }, fixedTimestamp),
    ).toThrow("total_value must be a finite number");
    expect(() => allocateRevenue({ total_value: -1 }, fixedTimestamp)).toThrow(
      "total_value must be zero or greater",
    );
  });
});
