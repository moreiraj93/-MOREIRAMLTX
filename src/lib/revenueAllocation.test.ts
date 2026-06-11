import { describe, expect, it } from 'vitest';
import {
  allocateRevenue,
  getRevenueAllocationRates,
  LARGE_DEAL_RATES,
  STANDARD_DEAL_RATES,
} from './revenueAllocation';

const fixedNow = new Date('2026-06-11T02:01:13.889Z');

describe('allocateRevenue', () => {
  it('uses the standard split for deals at or below the $10k threshold', () => {
    expect(getRevenueAllocationRates(10_000)).toEqual(STANDARD_DEAL_RATES);

    expect(allocateRevenue({ total_value: 10_000 }, { now: fixedNow })).toEqual({
      tax_reserve: 2500,
      ops_fund: 2500,
      owner_sweep: 5000,
      total_processed: 10000,
      status: 'READY_FOR_RTP',
      timestamp: '2026-06-11T02:01:13.889Z',
    });
  });

  it('uses the large-deal tax reserve for deals over $10k', () => {
    expect(getRevenueAllocationRates(10_000.01)).toEqual(LARGE_DEAL_RATES);

    expect(allocateRevenue({ total_value: 12_000 }, { now: fixedNow })).toEqual({
      tax_reserve: 4200,
      ops_fund: 1800,
      owner_sweep: 6000,
      total_processed: 12000,
      status: 'READY_FOR_RTP',
      timestamp: '2026-06-11T02:01:13.889Z',
    });
  });

  it('holds owner sweeps of $10 or less in the business account', () => {
    expect(allocateRevenue({ total_value: 20 }, { now: fixedNow }).status).toBe(
      'HOLD_IN_BUSINESS_ACCOUNT',
    );
    expect(allocateRevenue({ total_value: 20.02 }, { now: fixedNow })).toMatchObject({
      owner_sweep: 10.01,
      status: 'READY_FOR_RTP',
    });
  });

  it('normalizes string input to cents and keeps allocated totals reconciled', () => {
    const result = allocateRevenue({ total_value: '0.05' }, { now: fixedNow });

    expect(result).toMatchObject({
      tax_reserve: 0.01,
      ops_fund: 0.01,
      owner_sweep: 0.03,
      total_processed: 0.05,
    });
    expect(result.tax_reserve + result.ops_fund + result.owner_sweep).toBe(
      result.total_processed,
    );
  });

  it('rejects invalid totals before creating a banking instruction', () => {
    expect(() => allocateRevenue({ total_value: Number.NaN })).toThrow(
      'total_value must be a finite number',
    );
    expect(() => allocateRevenue({ total_value: -1 })).toThrow(
      'total_value cannot be negative',
    );
  });
});
