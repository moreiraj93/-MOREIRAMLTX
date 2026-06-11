import { describe, expect, it } from 'vitest';
import { allocateRevenue } from './revenueAllocation';

const NOW = new Date('2026-06-11T07:00:00.000Z');

describe('allocateRevenue', () => {
  it('allocates smaller deals at 25% tax, 25% ops, and 50% owner sweep', () => {
    expect(allocateRevenue({ total_value: 1_000 }, { now: NOW })).toEqual({
      tax_reserve: 250,
      ops_fund: 250,
      owner_sweep: 500,
      total_processed: 1_000,
      status: 'READY_FOR_RTP',
      timestamp: '2026-06-11T07:00:00.000Z',
    });
  });

  it('keeps exactly $10,000 in the standard deal tier', () => {
    expect(allocateRevenue({ total_value: 10_000 }, { now: NOW })).toMatchObject({
      tax_reserve: 2_500,
      ops_fund: 2_500,
      owner_sweep: 5_000,
      total_processed: 10_000,
      status: 'READY_FOR_RTP',
    });
  });

  it('allocates deals over $10,000 at 35% tax, 15% ops, and 50% owner sweep', () => {
    expect(allocateRevenue({ total_value: 12_000 }, { now: NOW })).toMatchObject({
      tax_reserve: 4_200,
      ops_fund: 1_800,
      owner_sweep: 6_000,
      total_processed: 12_000,
      status: 'READY_FOR_RTP',
    });
  });

  it('holds owner sweeps of $10 or less in the business account', () => {
    expect(allocateRevenue({ total_value: 20 }, { now: NOW })).toMatchObject({
      tax_reserve: 5,
      ops_fund: 5,
      owner_sweep: 10,
      status: 'HOLD_IN_BUSINESS_ACCOUNT',
    });
  });

  it('marks owner sweeps above $10 as ready for RTP', () => {
    expect(allocateRevenue({ total_value: '20.02' }, { now: NOW })).toMatchObject({
      tax_reserve: 5.01,
      ops_fund: 5,
      owner_sweep: 10.01,
      total_processed: 20.02,
      status: 'READY_FOR_RTP',
    });
  });

  it('reconciles rounded cents back to the normalized total', () => {
    const result = allocateRevenue({ total_value: 0.05 }, { now: NOW });

    expect(result.tax_reserve + result.ops_fund + result.owner_sweep).toBe(result.total_processed);
    expect(result).toMatchObject({
      tax_reserve: 0.01,
      ops_fund: 0.01,
      owner_sweep: 0.03,
      total_processed: 0.05,
      status: 'HOLD_IN_BUSINESS_ACCOUNT',
    });
  });

  it('rejects invalid totals', () => {
    expect(() => allocateRevenue({ total_value: Number.POSITIVE_INFINITY })).toThrow(
      'total_value must be a finite number.',
    );
    expect(() => allocateRevenue({ total_value: -1 })).toThrow('total_value cannot be negative.');
  });
});
