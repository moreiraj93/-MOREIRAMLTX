import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { calculateRevenueAllocation } from './revenueAllocation.js';

const fixedDate = new Date('2026-06-10T03:00:00.000Z');

describe('calculateRevenueAllocation', () => {
  it('uses the standard tier for deals up to and including 10000', () => {
    assert.deepEqual(calculateRevenueAllocation({ total_value: 10000 }, fixedDate), {
      tax_reserve: 2500,
      ops_fund: 2500,
      owner_sweep: 5000,
      total_processed: 10000,
      status: 'READY_FOR_RTP',
      tier: 'standard',
      timestamp: '2026-06-10T03:00:00.000Z',
    });
  });

  it('uses the over-10000 tier for larger deals', () => {
    assert.deepEqual(calculateRevenueAllocation({ total_value: 12000 }, fixedDate), {
      tax_reserve: 4200,
      ops_fund: 1800,
      owner_sweep: 6000,
      total_processed: 12000,
      status: 'READY_FOR_RTP',
      tier: 'over_10000',
      timestamp: '2026-06-10T03:00:00.000Z',
    });
  });

  it('holds owner sweeps of exactly 10 dollars or less', () => {
    const allocation = calculateRevenueAllocation({ total_value: 20 }, fixedDate);

    assert.equal(allocation.owner_sweep, 10);
    assert.equal(allocation.status, 'HOLD_IN_BUSINESS_ACCOUNT');
  });

  it('accepts currency strings and keeps the buckets balanced to the cent', () => {
    const allocation = calculateRevenueAllocation({ total_value: '1234.56' }, fixedDate);

    assert.equal(allocation.tax_reserve, 308.64);
    assert.equal(allocation.ops_fund, 308.64);
    assert.equal(allocation.owner_sweep, 617.28);
    assert.equal(
      Number((allocation.tax_reserve + allocation.ops_fund + allocation.owner_sweep).toFixed(2)),
      allocation.total_processed,
    );
  });

  it('rejects missing, zero, negative, and malformed totals', () => {
    assert.throws(() => calculateRevenueAllocation({}), /total_value/);
    assert.throws(() => calculateRevenueAllocation({ total_value: 0 }), /greater than zero/);
    assert.throws(() => calculateRevenueAllocation({ total_value: -1 }), /greater than zero/);
    assert.throws(() => calculateRevenueAllocation({ total_value: '10.999' }), /currency amount/);
    assert.throws(() => calculateRevenueAllocation({ total_value: 'abc' }), /currency amount/);
  });
});
