import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { calculateRevenueAllocation } from './revenueAllocation.js';

const fixedDate = new Date('2026-06-10T06:01:31.535Z');

describe('calculateRevenueAllocation', () => {
  it('uses the standard rates for deals up to and including 10000', () => {
    assert.deepEqual(calculateRevenueAllocation({ total_value: 10000 }, fixedDate), {
      tax_reserve: 2500,
      ops_fund: 2500,
      owner_sweep: 5000,
      total_processed: 10000,
      status: 'READY_FOR_RTP',
      timestamp: '2026-06-10T06:01:31.535Z',
    });
  });

  it('uses the large-deal rates for deals over 10000', () => {
    assert.deepEqual(calculateRevenueAllocation({ total_value: 12500 }, fixedDate), {
      tax_reserve: 4375,
      ops_fund: 1875,
      owner_sweep: 6250,
      total_processed: 12500,
      status: 'READY_FOR_RTP',
      timestamp: '2026-06-10T06:01:31.535Z',
    });
  });

  it('accepts numeric strings from automation platforms', () => {
    assert.deepEqual(calculateRevenueAllocation({ total_value: '1234.56' }, fixedDate), {
      tax_reserve: 308.64,
      ops_fund: 308.64,
      owner_sweep: 617.28,
      total_processed: 1234.56,
      status: 'READY_FOR_RTP',
      timestamp: '2026-06-10T06:01:31.535Z',
    });
  });

  it('keeps rounded currency buckets balanced to the cent', () => {
    const allocation = calculateRevenueAllocation({ total_value: '0.03' }, fixedDate);

    assert.deepEqual(allocation, {
      tax_reserve: 0.01,
      ops_fund: 0.01,
      owner_sweep: 0.01,
      total_processed: 0.03,
      status: 'HOLD_IN_BUSINESS_ACCOUNT',
      timestamp: '2026-06-10T06:01:31.535Z',
    });
  });

  it('holds owner sweeps of 10 dollars or less in the business account', () => {
    assert.deepEqual(calculateRevenueAllocation({ total_value: 20 }, fixedDate), {
      tax_reserve: 5,
      ops_fund: 5,
      owner_sweep: 10,
      total_processed: 20,
      status: 'HOLD_IN_BUSINESS_ACCOUNT',
      timestamp: '2026-06-10T06:01:31.535Z',
    });
  });

  it('rejects missing, zero, negative, and malformed totals', () => {
    assert.throws(() => calculateRevenueAllocation({}), /total_value/);
    assert.throws(() => calculateRevenueAllocation({ total_value: 0 }), /greater than zero/);
    assert.throws(() => calculateRevenueAllocation({ total_value: -1 }), /greater than zero/);
    assert.throws(() => calculateRevenueAllocation({ total_value: '10.999' }), /currency amount/);
    assert.throws(() => calculateRevenueAllocation({ total_value: 'abc' }), /currency amount/);
  });
});
