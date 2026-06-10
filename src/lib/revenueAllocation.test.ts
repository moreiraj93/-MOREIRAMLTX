import { describe, expect, it } from 'vitest';
import { allocateRevenue } from './revenueAllocation';

const fixedNow = new Date('2026-06-10T20:01:00.367Z');

describe('allocateRevenue', () => {
  it('allocates smaller deals with 25% tax, 25% ops, and 50% owner sweep', () => {
    expect(allocateRevenue({ total_value: 10000 }, { now: fixedNow })).toEqual({
      tax_reserve: 2500,
      ops_fund: 2500,
      owner_sweep: 5000,
      total_processed: 10000,
      status: 'READY_FOR_RTP',
      timestamp: '2026-06-10T20:01:00.367Z',
    });
  });

  it('allocates deals over $10,000 with 35% tax, 15% ops, and 50% owner sweep', () => {
    expect(allocateRevenue({ total_value: 12000 }, { now: fixedNow })).toEqual({
      tax_reserve: 4200,
      ops_fund: 1800,
      owner_sweep: 6000,
      total_processed: 12000,
      status: 'READY_FOR_RTP',
      timestamp: '2026-06-10T20:01:00.367Z',
    });
  });

  it('keeps exactly $10,000 in the smaller-deal tier', () => {
    const result = allocateRevenue({ total_value: 10000 }, { now: fixedNow });

    expect(result.tax_reserve).toBe(2500);
    expect(result.ops_fund).toBe(2500);
    expect(result.owner_sweep).toBe(5000);
  });

  it('holds the sweep when the owner share is $10.00 or less', () => {
    expect(allocateRevenue({ total_value: 20 }, { now: fixedNow }).status).toBe('HOLD_IN_BUSINESS_ACCOUNT');
    expect(allocateRevenue({ total_value: 20.02 }, { now: fixedNow }).status).toBe('READY_FOR_RTP');
  });

  it('normalizes numeric string input and reconciles fractional cents back to the total', () => {
    const result = allocateRevenue({ total_value: '0.10' }, { now: fixedNow });

    expect(result).toMatchObject({
      tax_reserve: 0.03,
      ops_fund: 0.02,
      owner_sweep: 0.05,
      total_processed: 0.1,
    });
    expect(result.tax_reserve + result.ops_fund + result.owner_sweep).toBe(result.total_processed);
  });

  it('rejects invalid totals before producing banking output', () => {
    expect(() => allocateRevenue({ total_value: 'not-a-number' })).toThrow('total_value must be a finite number');
    expect(() => allocateRevenue({ total_value: -1 })).toThrow('total_value must be greater than or equal to 0');
  });
});
