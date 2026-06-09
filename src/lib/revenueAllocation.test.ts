import { describe, expect, it } from 'vitest';
import { allocateRevenue, ratesForTotalValue } from './revenueAllocation';

const timestamp = new Date('2026-06-09T18:00:00.000Z');

describe('revenue allocation', () => {
  it('uses the smaller-deal allocation at and below $10,000', () => {
    expect(ratesForTotalValue(10000)).toEqual({
      taxRate: 0.25,
      opsRate: 0.25,
      ownerRate: 0.5,
    });

    expect(allocateRevenue({ total_value: 10000 }, timestamp)).toMatchObject({
      tax_reserve: 2500,
      ops_fund: 2500,
      owner_sweep: 5000,
      total_processed: 10000,
      status: 'READY_FOR_RTP',
      timestamp: '2026-06-09T18:00:00.000Z',
    });
  });

  it('uses the larger-deal allocation above $10,000', () => {
    expect(allocateRevenue({ total_value: 12000 }, timestamp)).toMatchObject({
      tax_reserve: 4200,
      ops_fund: 1800,
      owner_sweep: 6000,
      total_processed: 12000,
      status: 'READY_FOR_RTP',
    });
  });

  it('holds pennies in the business account until owner sweep exceeds $10', () => {
    expect(allocateRevenue({ total_value: 20 }, timestamp).status).toBe('HOLD_IN_BUSINESS_ACCOUNT');
    expect(allocateRevenue({ total_value: 20.02 }, timestamp).status).toBe('READY_FOR_RTP');
  });

  it('rounds every money field to cents', () => {
    expect(allocateRevenue({ total_value: 33.335 }, timestamp)).toMatchObject({
      tax_reserve: 8.33,
      ops_fund: 8.33,
      owner_sweep: 16.67,
      total_processed: 33.34,
    });
  });

  it('rejects negative or non-finite deal values', () => {
    expect(() => allocateRevenue({ total_value: -1 }, timestamp)).toThrow('non-negative finite number');
    expect(() => allocateRevenue({ total_value: Number.NaN }, timestamp)).toThrow('non-negative finite number');
    expect(() => allocateRevenue({ total_value: Number.POSITIVE_INFINITY }, timestamp)).toThrow('non-negative finite number');
  });
});
