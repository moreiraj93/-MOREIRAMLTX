import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { allocateRevenue, getRevenueAllocationRates } from '../src/lib/revenueAllocation.js';

const fixedNow = new Date('2026-06-10T05:01:23.950Z');

describe('allocateRevenue', () => {
  it('allocates smaller deals with 25% tax, 25% ops, and 50% owner sweep', () => {
    assert.deepEqual(allocateRevenue({ total_value: 8000 }, { now: fixedNow }), {
      tax_reserve: 2000,
      ops_fund: 2000,
      owner_sweep: 4000,
      total_processed: 8000,
      status: 'READY_FOR_RTP',
      timestamp: '2026-06-10T05:01:23.950Z',
    });
  });

  it('allocates deals over $10,000 with the higher tax reserve tier', () => {
    assert.deepEqual(allocateRevenue({ total_value: 12000 }, { now: fixedNow }), {
      tax_reserve: 4200,
      ops_fund: 1800,
      owner_sweep: 6000,
      total_processed: 12000,
      status: 'READY_FOR_RTP',
      timestamp: '2026-06-10T05:01:23.950Z',
    });
  });

  it('keeps the $10,000 boundary in the smaller deal tier', () => {
    assert.deepEqual(getRevenueAllocationRates(10000), {
      tax: 25,
      ops: 25,
      owner: 50,
    });
  });

  it('holds transfers when the owner sweep is exactly $10 or less', () => {
    assert.equal(
      allocateRevenue({ total_value: 20 }, { now: fixedNow }).status,
      'HOLD_IN_BUSINESS_ACCOUNT',
    );
    assert.equal(
      allocateRevenue({ total_value: 20.02 }, { now: fixedNow }).status,
      'READY_FOR_RTP',
    );
  });

  it('normalizes input to cents and keeps allocations balanced', () => {
    const allocation = allocateRevenue({ total_value: '10000.01' }, { now: fixedNow });

    assert.equal(allocation.tax_reserve, 3500);
    assert.equal(allocation.ops_fund, 1500);
    assert.equal(allocation.owner_sweep, 5000.01);
    assert.equal(
      allocation.tax_reserve + allocation.ops_fund + allocation.owner_sweep,
      allocation.total_processed,
    );
  });

  it('rejects invalid totals', () => {
    assert.throws(() => allocateRevenue({ total_value: -1 }), /cannot be negative/);
    assert.throws(() => allocateRevenue({ total_value: 'not money' }), /finite number/);
    assert.throws(() => allocateRevenue({}), /finite number/);
  });
});
