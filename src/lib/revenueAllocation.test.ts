import { describe, expect, it } from 'vitest';
import { allocateRevenue, BIG_DEAL_THRESHOLD, MIN_OWNER_SWEEP } from './revenueAllocation';

const now = new Date('2026-06-09T21:01:11.258Z');

describe('allocateRevenue', () => {
  it('uses standard rates for deals at or below the threshold', () => {
    expect(allocateRevenue({ total_value: BIG_DEAL_THRESHOLD, now })).toEqual({
      tax_reserve: 2500,
      ops_fund: 2500,
      owner_sweep: 5000,
      total_processed: 10000,
      status: 'READY_FOR_RTP',
      timestamp: '2026-06-09T21:01:11.258Z',
      tier: 'standard',
      rates: {
        tax: 0.25,
        ops: 0.25,
        owner: 0.5,
      },
    });
  });

  it('uses large-deal rates only when the deal is over the threshold', () => {
    const allocation = allocateRevenue({ total_value: 10000.01, now });

    expect(allocation.tax_reserve).toBe(3500);
    expect(allocation.ops_fund).toBe(1500);
    expect(allocation.owner_sweep).toBe(5000.01);
    expect(allocation.tier).toBe('large_deal');
    expect(allocation.rates).toEqual({
      tax: 0.35,
      ops: 0.15,
      owner: 0.5,
    });
  });

  it('holds pennies in the business account until the owner sweep clears the minimum', () => {
    expect(allocateRevenue({ total_value: MIN_OWNER_SWEEP * 2, now }).status).toBe('HOLD_IN_BUSINESS_ACCOUNT');
    expect(allocateRevenue({ total_value: MIN_OWNER_SWEEP * 2 + 0.02, now }).status).toBe('READY_FOR_RTP');
  });

  it('rounds each bag to two decimal places', () => {
    expect(allocateRevenue({ total_value: 123.456, now })).toMatchObject({
      tax_reserve: 30.86,
      ops_fund: 30.86,
      owner_sweep: 61.73,
    });
  });

  it('rejects invalid totals before calculating a payout', () => {
    expect(() => allocateRevenue({ total_value: Number.NaN, now })).toThrow('finite number');
    expect(() => allocateRevenue({ total_value: -1, now })).toThrow('zero or greater');
  });
});
