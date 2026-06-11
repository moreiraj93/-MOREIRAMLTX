import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { calculateRevenueAllocation, revenueAllocationConfig } from './revenueAllocation.js';

const fixedNow = new Date('2026-06-11T04:00:00.000Z');

describe('calculateRevenueAllocation', () => {
  it('uses smaller-deal rates at and below the threshold', () => {
    const allocation = calculateRevenueAllocation({ total_value: 10000 }, fixedNow);

    assert.deepEqual(allocation, {
      tax_reserve: 2500,
      ops_fund: 2500,
      owner_sweep: 5000,
      total_processed: 10000,
      status: 'READY_FOR_RTP',
      timestamp: fixedNow.toISOString(),
    });
  });

  it('uses big-deal rates above the threshold', () => {
    const allocation = calculateRevenueAllocation({ total_value: 12500 }, fixedNow);

    assert.equal(allocation.tax_reserve, 4375);
    assert.equal(allocation.ops_fund, 1875);
    assert.equal(allocation.owner_sweep, 6250);
    assert.equal(allocation.status, 'READY_FOR_RTP');
  });

  it('holds the sweep when the owner amount is not over the minimum', () => {
    const allocation = calculateRevenueAllocation({ total_value: 20 }, fixedNow);

    assert.equal(allocation.owner_sweep, revenueAllocationConfig.ownerSweepMinimum);
    assert.equal(allocation.status, 'HOLD_IN_BUSINESS_ACCOUNT');
  });

  it('accepts numeric strings from automation payloads', () => {
    const allocation = calculateRevenueAllocation({ total_value: '99.99' }, fixedNow);

    assert.equal(allocation.tax_reserve, 25);
    assert.equal(allocation.ops_fund, 25);
    assert.equal(allocation.owner_sweep, 50);
  });

  it('rejects missing, non-finite, and negative totals', () => {
    assert.throws(() => calculateRevenueAllocation({}, fixedNow), /finite number/);
    assert.throws(() => calculateRevenueAllocation({ total_value: Number.NaN }, fixedNow), /finite number/);
    assert.throws(() => calculateRevenueAllocation({ total_value: -1 }, fixedNow), /greater than or equal to 0/);
  });
});
