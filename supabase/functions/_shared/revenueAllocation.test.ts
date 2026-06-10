import { describe, expect, it } from "vitest";
import { allocateRevenue } from "./revenueAllocation.ts";

const fixedTimestamp = "2026-06-10T11:57:00.000Z";
const fixedNow = () => new Date(fixedTimestamp);

describe("allocateRevenue", () => {
  it("allocates high-value deals with a larger tax reserve", () => {
    expect(allocateRevenue({ total_value: 15_000 }, fixedNow)).toEqual({
      tax_reserve: 5_250,
      ops_fund: 2_250,
      owner_sweep: 7_500,
      total_processed: 15_000,
      status: "READY_FOR_RTP",
      timestamp: fixedTimestamp,
    });
  });

  it("allocates smaller deals with balanced tax and ops reserves", () => {
    expect(allocateRevenue({ total_value: 5_000 }, fixedNow)).toEqual({
      tax_reserve: 1_250,
      ops_fund: 1_250,
      owner_sweep: 2_500,
      total_processed: 5_000,
      status: "READY_FOR_RTP",
      timestamp: fixedTimestamp,
    });
  });

  it("uses the smaller-deal rates at the exact 10000 boundary", () => {
    expect(allocateRevenue({ total_value: 10_000 }, fixedNow)).toMatchObject({
      tax_reserve: 2_500,
      ops_fund: 2_500,
      owner_sweep: 5_000,
      total_processed: 10_000,
      status: "READY_FOR_RTP",
    });
  });

  it("holds funds when owner sweep is exactly 10", () => {
    expect(allocateRevenue({ total_value: 20 }, fixedNow)).toMatchObject({
      tax_reserve: 5,
      ops_fund: 5,
      owner_sweep: 10,
      status: "HOLD_IN_BUSINESS_ACCOUNT",
    });
  });

  it("marks funds ready when owner sweep is more than 10", () => {
    expect(allocateRevenue({ total_value: 20.02 }, fixedNow)).toMatchObject({
      tax_reserve: 5.01,
      ops_fund: 5.01,
      owner_sweep: 10.01,
      status: "READY_FOR_RTP",
    });
  });

  it("rounds calculated amounts to cents", () => {
    expect(allocateRevenue({ total_value: "1234.567" }, fixedNow)).toMatchObject({
      tax_reserve: 308.64,
      ops_fund: 308.64,
      owner_sweep: 617.28,
      total_processed: 1234.567,
    });
  });

  it("rejects invalid total values", () => {
    expect(() => allocateRevenue({ total_value: "nope" }, fixedNow)).toThrow(
      "total_value must be a finite number"
    );
    expect(() => allocateRevenue({ total_value: -1 }, fixedNow)).toThrow(
      "total_value must be greater than or equal to 0"
    );
  });
});
