import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { allocateRevenue, revenueAllocationRates } from './revenueAllocation.js';

const fixedTimestamp = new Date('2026-06-11T05:00:00.000Z');

describe('allocateRevenue', () => {
  it('allocates smaller deals with 25% tax, 25% ops, and 50% owner sweep', () => {
    assert.deepEqual(allocateRevenue({ total_value: 5000 }, fixedTimestamp), {
      tax_reserve: 1250,
      ops_fund: 1250,
      owner_sweep: 2500,
      total_processed: 5000,
      status: 'READY_FOR_RTP',
      timestamp: '2026-06-11T05:00:00.000Z',
    });
  });

  it('keeps exactly 10000 in the smaller-deal tier', () => {
    assert.deepEqual(revenueAllocationRates(10000), {
      taxRate: 0.25,
      opsRate: 0.25,
      ownerRate: 0.5,
    });
  });

  it('allocates deals over 10000 with the high-value reserve rates', () => {
    assert.deepEqual(allocateRevenue({ total_value: 12000 }, fixedTimestamp), {
      tax_reserve: 4200,
      ops_fund: 1800,
      owner_sweep: 6000,
      total_processed: 12000,
      status: 'READY_FOR_RTP',
      timestamp: '2026-06-11T05:00:00.000Z',
    });
  });

  it('holds sweeps of 10 or less in the business account', () => {
    assert.equal(allocateRevenue({ total_value: 20 }, fixedTimestamp).status, 'HOLD_IN_BUSINESS_ACCOUNT');
    assert.equal(allocateRevenue({ total_value: 20.02 }, fixedTimestamp).status, 'READY_FOR_RTP');
  });

  it('accepts numeric strings from automation payloads', () => {
    assert.equal(allocateRevenue({ total_value: '100.50' }, fixedTimestamp).owner_sweep, 50.25);
  });

  it('rejects invalid totals', () => {
    assert.throws(() => allocateRevenue({ total_value: -1 }, fixedTimestamp), /greater than or equal to 0/);
    assert.throws(() => allocateRevenue({ total_value: 'not-a-number' }, fixedTimestamp), /finite number/);
    assert.throws(() => allocateRevenue({}, fixedTimestamp), /finite number/);
  });
});
