import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { calculateRevenueAllocation } from './revenueAllocation.js';

const fixedClock = () => new Date('2026-06-10T04:01:00.000Z');

describe('calculateRevenueAllocation', () => {
  it('allocates smaller deals with 25% tax, 25% ops, and 50% owner sweep', () => {
    assert.deepEqual(calculateRevenueAllocation({ total_value: 10000 }, fixedClock), {
      tax_reserve: 2500,
      ops_fund: 2500,
      owner_sweep: 5000,
      total_processed: 10000,
      status: 'READY_FOR_RTP',
      timestamp: '2026-06-10T04:01:00.000Z',
    });
  });

  it('allocates larger deals with 35% tax, 15% ops, and 50% owner sweep', () => {
    assert.deepEqual(calculateRevenueAllocation({ total_value: 12500 }, fixedClock), {
      tax_reserve: 4375,
      ops_fund: 1875,
      owner_sweep: 6250,
      total_processed: 12500,
      status: 'READY_FOR_RTP',
      timestamp: '2026-06-10T04:01:00.000Z',
    });
  });

  it('accepts numeric strings from automation platforms', () => {
    assert.deepEqual(calculateRevenueAllocation({ total_value: '1234.56' }, fixedClock), {
      tax_reserve: 308.64,
      ops_fund: 308.64,
      owner_sweep: 617.28,
      total_processed: 1234.56,
      status: 'READY_FOR_RTP',
      timestamp: '2026-06-10T04:01:00.000Z',
    });
  });

  it('holds tiny owner sweeps in the business account', () => {
    assert.deepEqual(calculateRevenueAllocation({ total_value: 20 }, fixedClock), {
      tax_reserve: 5,
      ops_fund: 5,
      owner_sweep: 10,
      total_processed: 20,
      status: 'HOLD_IN_BUSINESS_ACCOUNT',
      timestamp: '2026-06-10T04:01:00.000Z',
    });
  });

  it('rejects missing, zero, negative, and non-numeric totals', () => {
    for (const total_value of [undefined, 0, -1, 'not-a-number', '']) {
      assert.throws(
        () => calculateRevenueAllocation({ total_value }, fixedClock),
        /total_value must be a positive number/,
      );
    }
  });
});
