import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { allocateRevenue } from './revenueAllocation.js';

const now = new Date('2026-06-11T11:02:21.100Z');

describe('allocateRevenue', () => {
  it('uses the standard split for deals up to and including $10,000', () => {
    assert.deepEqual(allocateRevenue({ total_value: 10_000 }, { now }), {
      tax_reserve: 2500,
      ops_fund: 2500,
      owner_sweep: 5000,
      total_processed: 10000,
      status: 'READY_FOR_RTP',
      timestamp: '2026-06-11T11:02:21.100Z',
    });
  });

  it('uses the big-deal split above $10,000', () => {
    assert.deepEqual(allocateRevenue({ total_value: 12_000 }, { now }), {
      tax_reserve: 4200,
      ops_fund: 1800,
      owner_sweep: 6000,
      total_processed: 12000,
      status: 'READY_FOR_RTP',
      timestamp: '2026-06-11T11:02:21.100Z',
    });
  });

  it('holds the sweep when the owner amount is $10 or less', () => {
    assert.equal(allocateRevenue({ total_value: 20 }, { now }).status, 'HOLD_IN_BUSINESS_ACCOUNT');
    assert.equal(allocateRevenue({ total_value: 20.02 }, { now }).status, 'READY_FOR_RTP');
  });

  it('keeps rounded allocations reconciled to the processed total', () => {
    const result = allocateRevenue({ total_value: 100.01 }, { now });
    const allocatedTotal = result.tax_reserve + result.ops_fund + result.owner_sweep;

    assert.equal(Number(allocatedTotal.toFixed(2)), result.total_processed);
    assert.deepEqual(result, {
      tax_reserve: 25,
      ops_fund: 25,
      owner_sweep: 50.01,
      total_processed: 100.01,
      status: 'READY_FOR_RTP',
      timestamp: '2026-06-11T11:02:21.100Z',
    });
  });

  it('accepts Make-style string inputs', () => {
    assert.equal(allocateRevenue({ total_value: '100.50' }, { now }).owner_sweep, 50.25);
  });

  it('rejects missing, non-numeric, or negative totals', () => {
    assert.throws(() => allocateRevenue({}), /total_value is required/);
    assert.throws(() => allocateRevenue({ total_value: 'nope' }), /finite number/);
    assert.throws(() => allocateRevenue({ total_value: -1 }), /greater than or equal to 0/);
  });
});
