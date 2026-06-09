import test from 'node:test';
import assert from 'node:assert/strict';
import { allocateRevenue } from './revenueAllocation.js';

const FIXED_DATE = new Date('2026-06-09T19:00:00.000Z');

test('allocates smaller deals with 25% tax, 25% ops, and 50% owner sweep', () => {
  assert.deepEqual(allocateRevenue({ total_value: 1000 }, FIXED_DATE), {
    tax_reserve: 250,
    ops_fund: 250,
    owner_sweep: 500,
    total_processed: 1000,
    status: 'READY_FOR_RTP',
    timestamp: '2026-06-09T19:00:00.000Z',
  });
});

test('allocates deals over 10000 with the higher tax reserve tier', () => {
  assert.deepEqual(allocateRevenue({ total_value: 12000 }, FIXED_DATE), {
    tax_reserve: 4200,
    ops_fund: 1800,
    owner_sweep: 6000,
    total_processed: 12000,
    status: 'READY_FOR_RTP',
    timestamp: '2026-06-09T19:00:00.000Z',
  });
});

test('keeps exactly 10000 in the smaller deal tier', () => {
  const allocation = allocateRevenue({ total_value: 10000 }, FIXED_DATE);

  assert.equal(allocation.tax_reserve, 2500);
  assert.equal(allocation.ops_fund, 2500);
  assert.equal(allocation.owner_sweep, 5000);
});

test('holds owner sweep when the payout is 10 or less', () => {
  assert.equal(allocateRevenue({ total_value: 20 }, FIXED_DATE).owner_sweep, 10);
  assert.equal(allocateRevenue({ total_value: 20 }, FIXED_DATE).status, 'HOLD_IN_BUSINESS_ACCOUNT');
  assert.equal(allocateRevenue({ total_value: 20.02 }, FIXED_DATE).owner_sweep, 10.01);
  assert.equal(allocateRevenue({ total_value: 20.02 }, FIXED_DATE).status, 'READY_FOR_RTP');
});

test('accepts numeric strings from automation payloads', () => {
  assert.deepEqual(allocateRevenue({ total_value: '250.50' }, FIXED_DATE), {
    tax_reserve: 62.63,
    ops_fund: 62.63,
    owner_sweep: 125.25,
    total_processed: 250.5,
    status: 'READY_FOR_RTP',
    timestamp: '2026-06-09T19:00:00.000Z',
  });
});

test('rejects invalid total values', () => {
  assert.throws(() => allocateRevenue({ total_value: -1 }, FIXED_DATE), RangeError);
  assert.throws(() => allocateRevenue({ total_value: 'not-a-number' }, FIXED_DATE), TypeError);
  assert.throws(() => allocateRevenue({}, FIXED_DATE), TypeError);
});
