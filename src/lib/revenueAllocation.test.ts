import { describe, expect, it } from 'vitest';
import {
  allocateRevenue,
  getRevenueAllocationTier,
  LARGE_DEAL_THRESHOLD,
  OWNER_SWEEP_MINIMUM,
} from './revenueAllocation';

const processedAt = new Date('2026-06-10T02:00:15.529Z');

describe('allocateRevenue', () => {
  it('allocates smaller deals with 25% tax, 25% ops, and 50% owner sweep', () => {
    expect(allocateRevenue({ total_value: 1_000 }, processedAt)).toEqual({
      tax_reserve: 250,
      ops_fund: 250,
      owner_sweep: 500,
      total_processed: 1_000,
      status: 'READY_FOR_RTP',
      timestamp: '2026-06-10T02:00:15.529Z',
    });
  });

  it('uses the smaller-deal tier at exactly the large deal threshold', () => {
    const allocation = allocateRevenue({ total_value: LARGE_DEAL_THRESHOLD }, processedAt);

    expect(getRevenueAllocationTier(LARGE_DEAL_THRESHOLD)).toBe('standard');
    expect(allocation.tax_reserve).toBe(2_500);
    expect(allocation.ops_fund).toBe(2_500);
    expect(allocation.owner_sweep).toBe(5_000);
  });

  it('allocates deals above the threshold with 35% tax, 15% ops, and 50% owner sweep', () => {
    expect(allocateRevenue({ total_value: 20_000 }, processedAt)).toEqual({
      tax_reserve: 7_000,
      ops_fund: 3_000,
      owner_sweep: 10_000,
      total_processed: 20_000,
      status: 'READY_FOR_RTP',
      timestamp: '2026-06-10T02:00:15.529Z',
    });
  });

  it('rounds each bag to two currency decimals', () => {
    expect(allocateRevenue({ total_value: 123.456 }, processedAt)).toMatchObject({
      tax_reserve: 30.86,
      ops_fund: 30.86,
      owner_sweep: 61.73,
    });
  });

  it('holds owner sweeps that are not greater than the minimum', () => {
    expect(allocateRevenue({ total_value: OWNER_SWEEP_MINIMUM * 2 }, processedAt).status).toBe(
      'HOLD_IN_BUSINESS_ACCOUNT',
    );
    expect(allocateRevenue({ total_value: OWNER_SWEEP_MINIMUM * 2 + 0.02 }, processedAt).status).toBe(
      'READY_FOR_RTP',
    );
  });

  it('rejects invalid total values before producing money movement instructions', () => {
    expect(() => allocateRevenue({ total_value: Number.NaN }, processedAt)).toThrow(TypeError);
    expect(() => allocateRevenue({ total_value: Number.POSITIVE_INFINITY }, processedAt)).toThrow(
      TypeError,
    );
    expect(() => allocateRevenue({ total_value: -1 }, processedAt)).toThrow(RangeError);
  });
});
