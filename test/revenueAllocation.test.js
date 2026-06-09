import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  allocateRevenue,
  REVENUE_ALLOCATION_STATUS,
  RevenueAllocationError,
} from '../server/revenueAllocation.js';

const FIXED_NOW = () => new Date('2026-06-09T23:02:46.226Z');

describe('allocateRevenue', () => {
  it('uses the smaller-deal rates at and below the $10,000 threshold', () => {
    assert.deepEqual(allocateRevenue({ total_value: 10000 }, { now: FIXED_NOW }), {
      tax_reserve: 2500,
      ops_fund: 2500,
      owner_sweep: 5000,
      total_processed: 10000,
      status: REVENUE_ALLOCATION_STATUS.READY_FOR_RTP,
      timestamp: '2026-06-09T23:02:46.226Z',
    });
  });

  it('uses the larger-deal tax reserve rate above $10,000', () => {
    assert.deepEqual(allocateRevenue({ total_value: 10001 }, { now: FIXED_NOW }), {
      tax_reserve: 3500.35,
      ops_fund: 1500.15,
      owner_sweep: 5000.5,
      total_processed: 10001,
      status: REVENUE_ALLOCATION_STATUS.READY_FOR_RTP,
      timestamp: '2026-06-09T23:02:46.226Z',
    });
  });

  it('holds owner sweep transfers that are $10 or less', () => {
    const allocation = allocateRevenue({ total_value: 20 }, { now: FIXED_NOW });

    assert.equal(allocation.owner_sweep, 10);
    assert.equal(allocation.status, REVENUE_ALLOCATION_STATUS.HOLD_IN_BUSINESS_ACCOUNT);
  });

  it('keeps rounded cent allocations reconciled to the processed total', () => {
    const allocation = allocateRevenue({ total_value: 10.01 }, { now: FIXED_NOW });

    assert.equal(allocation.tax_reserve, 2.5);
    assert.equal(allocation.ops_fund, 2.5);
    assert.equal(allocation.owner_sweep, 5.01);
    assert.equal(
      Number((allocation.tax_reserve + allocation.ops_fund + allocation.owner_sweep).toFixed(2)),
      allocation.total_processed,
    );
  });

  it('rejects invalid totals', () => {
    assert.throws(() => allocateRevenue({ total_value: 'not-a-number' }), RevenueAllocationError);
    assert.throws(() => allocateRevenue({ total_value: -1 }), RevenueAllocationError);
  });
});
