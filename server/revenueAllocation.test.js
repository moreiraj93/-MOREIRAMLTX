import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { calculateRevenueAllocation } from './revenueAllocation.js';

const fixedTimestamp = new Date('2026-06-09T20:03:00.000Z');

describe('calculateRevenueAllocation', () => {
  it('allocates standard deals at 25% tax, 25% ops, and 50% owner sweep', () => {
    assert.deepEqual(calculateRevenueAllocation({ total_value: 10000 }, fixedTimestamp), {
      tax_reserve: 2500,
      ops_fund: 2500,
      owner_sweep: 5000,
      total_processed: 10000,
      status: 'READY_FOR_RTP',
      timestamp: '2026-06-09T20:03:00.000Z',
    });
  });

  it('allocates large deals at 35% tax, 15% ops, and 50% owner sweep', () => {
    assert.deepEqual(calculateRevenueAllocation({ total_value: 10000.01 }, fixedTimestamp), {
      tax_reserve: 3500,
      ops_fund: 1500,
      owner_sweep: 5000.01,
      total_processed: 10000.01,
      status: 'READY_FOR_RTP',
      timestamp: '2026-06-09T20:03:00.000Z',
    });
  });

  it('holds small owner sweeps in the business account', () => {
    assert.deepEqual(calculateRevenueAllocation({ total_value: 20 }, fixedTimestamp), {
      tax_reserve: 5,
      ops_fund: 5,
      owner_sweep: 10,
      total_processed: 20,
      status: 'HOLD_IN_BUSINESS_ACCOUNT',
      timestamp: '2026-06-09T20:03:00.000Z',
    });
  });

  it('accepts numeric strings from automation payloads', () => {
    assert.deepEqual(calculateRevenueAllocation({ total_value: '42.50' }, fixedTimestamp), {
      tax_reserve: 10.63,
      ops_fund: 10.63,
      owner_sweep: 21.25,
      total_processed: 42.5,
      status: 'READY_FOR_RTP',
      timestamp: '2026-06-09T20:03:00.000Z',
    });
  });

  it('rejects missing, non-finite, and negative totals', () => {
    assert.throws(() => calculateRevenueAllocation({}, fixedTimestamp), {
      name: 'TypeError',
      message: 'total_value must be a finite number',
    });
    assert.throws(() => calculateRevenueAllocation({ total_value: '' }, fixedTimestamp), {
      name: 'TypeError',
      message: 'total_value must be a finite number',
    });
    assert.throws(() => calculateRevenueAllocation({ total_value: null }, fixedTimestamp), {
      name: 'TypeError',
      message: 'total_value must be a finite number',
    });
    assert.throws(() => calculateRevenueAllocation({ total_value: Infinity }, fixedTimestamp), {
      name: 'TypeError',
      message: 'total_value must be a finite number',
    });
    assert.throws(() => calculateRevenueAllocation({ total_value: -1 }, fixedTimestamp), {
      name: 'RangeError',
      message: 'total_value must be greater than or equal to 0',
    });
  });
});
