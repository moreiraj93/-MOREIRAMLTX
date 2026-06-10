import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  HOLD_IN_BUSINESS_ACCOUNT,
  READY_FOR_RTP,
  allocateRevenue,
} from './revenueAllocation.js';

const fixedClock = () => new Date('2026-06-10T16:00:00.000Z');

describe('allocateRevenue', () => {
  it('uses the small-deal split at and below $10,000', () => {
    assert.deepEqual(allocateRevenue({ total_value: 10000 }, fixedClock), {
      tax_reserve: 2500,
      ops_fund: 2500,
      owner_sweep: 5000,
      total_processed: 10000,
      status: READY_FOR_RTP,
      timestamp: '2026-06-10T16:00:00.000Z',
    });
  });

  it('uses the large-deal split above $10,000', () => {
    assert.deepEqual(allocateRevenue({ total_value: 12000 }, fixedClock), {
      tax_reserve: 4200,
      ops_fund: 1800,
      owner_sweep: 6000,
      total_processed: 12000,
      status: READY_FOR_RTP,
      timestamp: '2026-06-10T16:00:00.000Z',
    });
  });

  it('holds tiny owner sweeps in the business account', () => {
    assert.equal(
      allocateRevenue({ total_value: 20 }, fixedClock).status,
      HOLD_IN_BUSINESS_ACCOUNT,
    );
  });

  it('accepts numeric strings from automation payloads', () => {
    const result = allocateRevenue({ total_value: '123.45' }, fixedClock);

    assert.equal(result.tax_reserve, 30.86);
    assert.equal(result.ops_fund, 30.86);
    assert.equal(result.owner_sweep, 61.73);
    assert.equal(result.total_processed, 123.45);
  });

  it('rejects invalid totals', () => {
    assert.throws(() => allocateRevenue({ total_value: 'not-a-number' }), {
      message: 'total_value must be a finite number',
      statusCode: 400,
    });
    assert.throws(() => allocateRevenue({ total_value: -1 }), {
      message: 'total_value must be greater than or equal to 0',
      statusCode: 400,
    });
  });
});
