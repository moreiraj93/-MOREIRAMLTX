import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  REVENUE_ALLOCATION_STATUS,
  calculateRevenueAllocation,
} from './revenueAllocation.js';

describe('calculateRevenueAllocation', () => {
  it('uses the small-deal allocation rates at and below $10,000', () => {
    const allocation = calculateRevenueAllocation({ total_value: 10000 });

    assert.equal(allocation.tax_reserve, 2500);
    assert.equal(allocation.ops_fund, 2500);
    assert.equal(allocation.owner_sweep, 5000);
    assert.equal(allocation.total_processed, 10000);
    assert.equal(allocation.status, REVENUE_ALLOCATION_STATUS.READY_FOR_RTP);
    assert.match(allocation.timestamp, /^\d{4}-\d{2}-\d{2}T/);
  });

  it('uses the large-deal tax reserve rate above $10,000', () => {
    const allocation = calculateRevenueAllocation({ total_value: 12000 });

    assert.equal(allocation.tax_reserve, 4200);
    assert.equal(allocation.ops_fund, 1800);
    assert.equal(allocation.owner_sweep, 6000);
    assert.equal(allocation.total_processed, 12000);
    assert.equal(allocation.status, REVENUE_ALLOCATION_STATUS.READY_FOR_RTP);
  });

  it('rounds currency values to cents', () => {
    const allocation = calculateRevenueAllocation({ total_value: 99.99 });

    assert.equal(allocation.tax_reserve, 25);
    assert.equal(allocation.ops_fund, 25);
    assert.equal(allocation.owner_sweep, 50);
  });

  it('holds owner sweeps of $10 or less in the business account', () => {
    const allocation = calculateRevenueAllocation({ total_value: 20 });

    assert.equal(allocation.owner_sweep, 10);
    assert.equal(allocation.status, REVENUE_ALLOCATION_STATUS.HOLD_IN_BUSINESS_ACCOUNT);
  });

  it('accepts numeric string input from automation tools', () => {
    const allocation = calculateRevenueAllocation({ total_value: '200.50' });

    assert.equal(allocation.tax_reserve, 50.13);
    assert.equal(allocation.ops_fund, 50.13);
    assert.equal(allocation.owner_sweep, 100.25);
  });

  it('rejects invalid totals', () => {
    assert.throws(
      () => calculateRevenueAllocation({ total_value: 'not-a-number' }),
      /total_value must be a finite number/,
    );
    assert.throws(
      () => calculateRevenueAllocation({ total_value: -1 }),
      /total_value must be greater than or equal to 0/,
    );
  });
});

