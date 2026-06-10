import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { calculateRevenueAllocation } from './revenueAllocation.js';

const fixedNow = new Date('2026-06-10T08:00:00.000Z');

describe('calculateRevenueAllocation', () => {
  it('allocates smaller deals with 25% tax, 25% ops, and 50% owner sweep', () => {
    assert.deepEqual(calculateRevenueAllocation({ total_value: 8000 }, fixedNow), {
      tax_reserve: 2000,
      ops_fund: 2000,
      owner_sweep: 4000,
      total_processed: 8000,
      status: 'READY_FOR_RTP',
      timestamp: '2026-06-10T08:00:00.000Z',
    });
  });

  it('allocates deals over 10000 with a larger tax reserve and smaller ops fund', () => {
    assert.deepEqual(calculateRevenueAllocation({ total_value: 12000 }, fixedNow), {
      tax_reserve: 4200,
      ops_fund: 1800,
      owner_sweep: 6000,
      total_processed: 12000,
      status: 'READY_FOR_RTP',
      timestamp: '2026-06-10T08:00:00.000Z',
    });
  });

  it('keeps the 10000 boundary in the smaller-deal tier', () => {
    const allocation = calculateRevenueAllocation({ total_value: 10000 }, fixedNow);

    assert.equal(allocation.tax_reserve, 2500);
    assert.equal(allocation.ops_fund, 2500);
    assert.equal(allocation.owner_sweep, 5000);
  });

  it('holds funds when the owner sweep is not more than 10 dollars', () => {
    assert.equal(
      calculateRevenueAllocation({ total_value: 20 }, fixedNow).status,
      'HOLD_IN_BUSINESS_ACCOUNT',
    );
    assert.equal(
      calculateRevenueAllocation({ total_value: 20.02 }, fixedNow).status,
      'READY_FOR_RTP',
    );
  });

  it('accepts numeric string totals from automation tools', () => {
    assert.deepEqual(calculateRevenueAllocation({ total_value: '100.50' }, fixedNow), {
      tax_reserve: 25.13,
      ops_fund: 25.13,
      owner_sweep: 50.25,
      total_processed: 100.5,
      status: 'READY_FOR_RTP',
      timestamp: '2026-06-10T08:00:00.000Z',
    });
  });

  it('rejects invalid total values', () => {
    assert.throws(() => calculateRevenueAllocation({}), /total_value must be a finite number/);
    assert.throws(
      () => calculateRevenueAllocation({ total_value: -1 }),
      /total_value must be greater than or equal to 0/,
    );
  });
});
