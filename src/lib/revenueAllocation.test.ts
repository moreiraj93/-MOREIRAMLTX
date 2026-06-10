import { describe, expect, it } from 'vitest';
import { allocateRevenue } from './revenueAllocation';

const TIMESTAMP = '2026-06-10T10:01:33.519Z';

describe('allocateRevenue', () => {
  it('allocates smaller deals at 25% tax, 25% ops, and 50% owner sweep', () => {
    expect(allocateRevenue({ total_value: 10_000 }, TIMESTAMP)).toEqual({
      tax_reserve: 2_500,
      ops_fund: 2_500,
      owner_sweep: 5_000,
      total_processed: 10_000,
      status: 'READY_FOR_RTP',
      timestamp: TIMESTAMP,
    });
  });

  it('allocates deals over $10k at 35% tax, 15% ops, and 50% owner sweep', () => {
    expect(allocateRevenue({ total_value: 10_000.01 }, TIMESTAMP)).toEqual({
      tax_reserve: 3_500,
      ops_fund: 1_500,
      owner_sweep: 5_000.01,
      total_processed: 10_000.01,
      status: 'READY_FOR_RTP',
      timestamp: TIMESTAMP,
    });
  });

  it('holds owner sweeps of $10 or less in the business account', () => {
    expect(allocateRevenue({ total_value: 20 }, TIMESTAMP)).toMatchObject({
      owner_sweep: 10,
      status: 'HOLD_IN_BUSINESS_ACCOUNT',
    });

    expect(allocateRevenue({ total_value: 20.02 }, TIMESTAMP)).toMatchObject({
      owner_sweep: 10.01,
      status: 'READY_FOR_RTP',
    });
  });

  it('accepts numeric string input from automation platforms', () => {
    expect(allocateRevenue({ total_value: '1234.56' }, TIMESTAMP)).toEqual({
      tax_reserve: 308.64,
      ops_fund: 308.64,
      owner_sweep: 617.28,
      total_processed: 1234.56,
      status: 'READY_FOR_RTP',
      timestamp: TIMESTAMP,
    });
  });

  it('rejects invalid total values before money movement can be mapped', () => {
    expect(() => allocateRevenue({ total_value: -1 }, TIMESTAMP)).toThrow(
      'total_value must be a non-negative number.',
    );
    expect(() => allocateRevenue({ total_value: 'not-a-number' }, TIMESTAMP)).toThrow(
      'total_value must be a non-negative number.',
    );
  });
});
