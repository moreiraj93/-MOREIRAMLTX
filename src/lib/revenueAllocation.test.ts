import { describe, expect, it } from 'vitest';

import { allocateRevenue } from './revenueAllocation';

const fixedTimestamp = new Date('2026-06-10T14:00:31.801Z');

describe('allocateRevenue', () => {
  it('allocates standard deals at 25% tax, 25% ops, and 50% owner sweep', () => {
    expect(allocateRevenue({ total_value: 10000 }, fixedTimestamp)).toEqual({
      tax_reserve: 2500,
      ops_fund: 2500,
      owner_sweep: 5000,
      total_processed: 10000,
      status: 'READY_FOR_RTP',
      timestamp: '2026-06-10T14:00:31.801Z',
    });
  });

  it('allocates large deals at 35% tax, 15% ops, and 50% owner sweep', () => {
    expect(allocateRevenue({ total_value: 10000.01 }, fixedTimestamp)).toEqual({
      tax_reserve: 3500,
      ops_fund: 1500,
      owner_sweep: 5000.01,
      total_processed: 10000.01,
      status: 'READY_FOR_RTP',
      timestamp: '2026-06-10T14:00:31.801Z',
    });
  });

  it('holds owner sweeps that are $10 or less', () => {
    expect(allocateRevenue({ total_value: 20 }, fixedTimestamp)).toMatchObject({
      owner_sweep: 10,
      status: 'HOLD_IN_BUSINESS_ACCOUNT',
    });
  });

  it('marks owner sweeps over $10 as ready for RTP', () => {
    expect(allocateRevenue({ total_value: 20.02 }, fixedTimestamp)).toMatchObject({
      owner_sweep: 10.01,
      status: 'READY_FOR_RTP',
    });
  });

  it('rounds allocation amounts to cents', () => {
    expect(allocateRevenue({ total_value: 33.335 }, fixedTimestamp)).toMatchObject({
      tax_reserve: 8.33,
      ops_fund: 8.33,
      owner_sweep: 16.67,
    });
  });

  it('rejects malformed totals before creating banking output', () => {
    expect(() => allocateRevenue({ total_value: Number.NaN }, fixedTimestamp)).toThrow(
      'total_value must be a non-negative number',
    );
    expect(() => allocateRevenue({ total_value: -1 }, fixedTimestamp)).toThrow(
      'total_value must be a non-negative number',
    );
  });
});
