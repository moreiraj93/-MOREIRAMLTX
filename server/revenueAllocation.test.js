import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { allocateRevenue } from './revenueAllocation.js';

const timestamp = '2026-06-10T07:02:04.707Z';

describe('allocateRevenue', () => {
  it('allocates smaller deals with 25% tax, 25% ops, and 50% owner sweep', () => {
    assert.deepEqual(allocateRevenue({ total_value: 10000 }, { timestamp }), {
      tax_reserve: 2500,
      ops_fund: 2500,
      owner_sweep: 5000,
      total_processed: 10000,
      status: 'READY_FOR_RTP',
      timestamp,
    });
  });

  it('allocates larger deals with 35% tax, 15% ops, and 50% owner sweep', () => {
    assert.deepEqual(allocateRevenue({ total_value: 12000 }, { timestamp }), {
      tax_reserve: 4200,
      ops_fund: 1800,
      owner_sweep: 6000,
      total_processed: 12000,
      status: 'READY_FOR_RTP',
      timestamp,
    });
  });

  it('holds funds in the business account when the owner sweep is not over $10', () => {
    assert.deepEqual(allocateRevenue({ total_value: 20 }, { timestamp }), {
      tax_reserve: 5,
      ops_fund: 5,
      owner_sweep: 10,
      total_processed: 20,
      status: 'HOLD_IN_BUSINESS_ACCOUNT',
      timestamp,
    });
  });

  it('accepts numeric strings from automation payloads', () => {
    assert.deepEqual(allocateRevenue({ total_value: '10000.01' }, { timestamp }), {
      tax_reserve: 3500,
      ops_fund: 1500,
      owner_sweep: 5000.01,
      total_processed: 10000.01,
      status: 'READY_FOR_RTP',
      timestamp,
    });
  });

  it('keeps rounded allocations equal to the processed total', () => {
    const result = allocateRevenue({ total_value: 0.03 }, { timestamp });

    assert.equal(result.tax_reserve + result.ops_fund + result.owner_sweep, result.total_processed);
    assert.deepEqual(result, {
      tax_reserve: 0.01,
      ops_fund: 0.01,
      owner_sweep: 0.01,
      total_processed: 0.03,
      status: 'HOLD_IN_BUSINESS_ACCOUNT',
      timestamp,
    });
  });

  it('rejects missing, non-numeric, and negative totals', () => {
    assert.throws(() => allocateRevenue({}), /finite number/);
    assert.throws(() => allocateRevenue({ total_value: 'winner' }), /finite number/);
    assert.throws(() => allocateRevenue({ total_value: -1 }), /greater than or equal to 0/);
  });
});
