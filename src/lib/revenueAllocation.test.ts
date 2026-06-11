import { describe, expect, it } from 'vitest';

import { allocateRevenue } from './revenueAllocation';

describe('allocateRevenue', () => {
  it('allocates smaller deals at 25% tax, 25% ops, and 50% owner', () => {
    const result = allocateRevenue({ total_value: 8_000 });

    expect(result).toMatchObject({
      tax_reserve: 2_000,
      ops_fund: 2_000,
      owner_sweep: 4_000,
      total_processed: 8_000,
      status: 'READY_FOR_RTP',
    });
    expect(Date.parse(result.timestamp)).not.toBeNaN();
  });

  it('allocates deals over $10,000 at 35% tax, 15% ops, and 50% owner', () => {
    const result = allocateRevenue({ total_value: 20_000 });

    expect(result).toMatchObject({
      tax_reserve: 7_000,
      ops_fund: 3_000,
      owner_sweep: 10_000,
      total_processed: 20_000,
      status: 'READY_FOR_RTP',
    });
  });

  it('keeps exactly $10,000 in the smaller-deal tier', () => {
    const result = allocateRevenue({ total_value: 10_000 });

    expect(result.tax_reserve).toBe(2_500);
    expect(result.ops_fund).toBe(2_500);
    expect(result.owner_sweep).toBe(5_000);
  });

  it('holds owner sweeps of $10 or less in the business account', () => {
    expect(allocateRevenue({ total_value: 20 }).owner_sweep).toBe(10);
    expect(allocateRevenue({ total_value: 20 }).status).toBe('HOLD_IN_BUSINESS_ACCOUNT');
    expect(allocateRevenue({ total_value: 20.02 }).owner_sweep).toBe(10.01);
    expect(allocateRevenue({ total_value: 20.02 }).status).toBe('READY_FOR_RTP');
  });

  it('normalizes inputs to cents and reconciles every cent to the processed total', () => {
    const result = allocateRevenue({ total_value: '10000.01' });
    const allocatedTotal = result.tax_reserve + result.ops_fund + result.owner_sweep;

    expect(result).toMatchObject({
      tax_reserve: 3500,
      ops_fund: 1500,
      owner_sweep: 5000.01,
      total_processed: 10000.01,
    });
    expect(allocatedTotal).toBe(result.total_processed);
  });

  it('rejects invalid totals', () => {
    expect(() => allocateRevenue({ total_value: 'not a number' })).toThrow(
      'total_value must be a finite number',
    );
    expect(() => allocateRevenue({ total_value: -1 })).toThrow(
      'total_value must be zero or greater',
    );
  });
});
