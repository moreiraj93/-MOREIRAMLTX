import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { allocateRevenue } from './revenueAllocation.js';

const fixedNow = new Date('2026-06-10T15:00:00.000Z');

describe('allocateRevenue', () => {
  it('uses standard rates for deals at or below $10,000', () => {
    assert.deepEqual(allocateRevenue({ total_value: 10000 }, fixedNow), {
      tax_reserve: 2500,
      ops_fund: 2500,
      owner_sweep: 5000,
      total_processed: 10000,
      status: 'READY_FOR_RTP',
      tier: 'standard',
      rates: {
        taxRate: 0.25,
        opsRate: 0.25,
        ownerRate: 0.5,
      },
      timestamp: '2026-06-10T15:00:00.000Z',
    });
  });

  it('uses big-deal rates only when the deal is greater than $10,000', () => {
    const result = allocateRevenue({ total_value: 10000.01 }, fixedNow);

    assert.equal(result.tax_reserve, 3500);
    assert.equal(result.ops_fund, 1500);
    assert.equal(result.owner_sweep, 5000.01);
    assert.equal(result.status, 'READY_FOR_RTP');
    assert.equal(result.tier, 'bigDeal');
    assert.deepEqual(result.rates, {
      taxRate: 0.35,
      opsRate: 0.15,
      ownerRate: 0.5,
    });
  });

  it('rounds each allocation to cents', () => {
    const result = allocateRevenue({ total_value: 123.456 }, fixedNow);

    assert.equal(result.tax_reserve, 30.86);
    assert.equal(result.ops_fund, 30.86);
    assert.equal(result.owner_sweep, 61.73);
    assert.equal(result.total_processed, 123.456);
  });

  it('holds funds when owner sweep is not greater than $10', () => {
    const result = allocateRevenue({ total_value: 20 }, fixedNow);

    assert.equal(result.owner_sweep, 10);
    assert.equal(result.status, 'HOLD_IN_BUSINESS_ACCOUNT');
  });

  it('accepts numeric string input from automation tools', () => {
    const result = allocateRevenue({ total_value: '40.50' }, fixedNow);

    assert.equal(result.tax_reserve, 10.13);
    assert.equal(result.ops_fund, 10.13);
    assert.equal(result.owner_sweep, 20.25);
    assert.equal(result.total_processed, 40.5);
    assert.equal(result.status, 'READY_FOR_RTP');
  });

  it('rejects missing, non-numeric, infinite, and negative totals', () => {
    for (const totalValue of [undefined, '', 'not-a-number', Number.POSITIVE_INFINITY, -1]) {
      assert.throws(
        () => allocateRevenue({ total_value: totalValue }, fixedNow),
        /total_value must/,
      );
    }
  });
});
