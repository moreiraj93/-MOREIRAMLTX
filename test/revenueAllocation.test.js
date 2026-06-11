import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { calculateRevenueAllocation } from '../server/revenueAllocation.js';

const fixedDate = new Date('2026-06-11T01:00:00.000Z');

describe('calculateRevenueAllocation', () => {
  it('uses the smaller-deal split at exactly $10,000', () => {
    assert.deepEqual(calculateRevenueAllocation({ total_value: 10000 }, fixedDate), {
      tax_reserve: 2500,
      ops_fund: 2500,
      owner_sweep: 5000,
      total_processed: 10000,
      status: 'READY_FOR_RTP',
      timestamp: '2026-06-11T01:00:00.000Z',
    });
  });

  it('uses the larger-deal tax reserve above $10,000', () => {
    assert.deepEqual(calculateRevenueAllocation({ total_value: 12000 }, fixedDate), {
      tax_reserve: 4200,
      ops_fund: 1800,
      owner_sweep: 6000,
      total_processed: 12000,
      status: 'READY_FOR_RTP',
      timestamp: '2026-06-11T01:00:00.000Z',
    });
  });

  it('holds owner sweeps of $10 or less in the business account', () => {
    assert.equal(
      calculateRevenueAllocation({ total_value: 20 }, fixedDate).status,
      'HOLD_IN_BUSINESS_ACCOUNT',
    );
    assert.equal(
      calculateRevenueAllocation({ total_value: 20.04 }, fixedDate).status,
      'READY_FOR_RTP',
    );
  });

  it('rounds to cents and reconciles all bags to the processed total', () => {
    const allocation = calculateRevenueAllocation({ total_value: 100.01 }, fixedDate);

    assert.deepEqual(allocation, {
      tax_reserve: 25,
      ops_fund: 25,
      owner_sweep: 50.01,
      total_processed: 100.01,
      status: 'READY_FOR_RTP',
      timestamp: '2026-06-11T01:00:00.000Z',
    });
    assert.equal(
      Number((allocation.tax_reserve + allocation.ops_fund + allocation.owner_sweep).toFixed(2)),
      allocation.total_processed,
    );
  });

  it('rejects invalid total values', () => {
    assert.throws(() => calculateRevenueAllocation({ total_value: 0 }), /positive number/);
    assert.throws(() => calculateRevenueAllocation({ total_value: 'nope' }), /positive number/);
    assert.throws(() => calculateRevenueAllocation({}), /positive number/);
  });
});

