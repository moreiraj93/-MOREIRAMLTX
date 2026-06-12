import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateRevenueAllocation } from '../server/revenueAllocation.js';

const fixedNow = new Date('2026-06-12T17:00:00.000Z');

test('allocates standard deals at 25/25/50 rates', () => {
  assert.deepEqual(calculateRevenueAllocation({ total_value: 1000 }, { now: fixedNow }), {
    tax_reserve: 250,
    ops_fund: 250,
    owner_sweep: 500,
    total_processed: 1000,
    status: 'READY_FOR_RTP',
    timestamp: '2026-06-12T17:00:00.000Z',
  });
});

test('allocates deals over 10000 at 35/15/50 rates', () => {
  assert.deepEqual(calculateRevenueAllocation({ total_value: 20000 }, { now: fixedNow }), {
    tax_reserve: 7000,
    ops_fund: 3000,
    owner_sweep: 10000,
    total_processed: 20000,
    status: 'READY_FOR_RTP',
    timestamp: '2026-06-12T17:00:00.000Z',
  });
});

test('keeps exactly 10000 in the standard tier', () => {
  assert.deepEqual(calculateRevenueAllocation({ total_value: 10000 }, { now: fixedNow }), {
    tax_reserve: 2500,
    ops_fund: 2500,
    owner_sweep: 5000,
    total_processed: 10000,
    status: 'READY_FOR_RTP',
    timestamp: '2026-06-12T17:00:00.000Z',
  });
});

test('holds owner sweep amounts of 10 or less', () => {
  const allocation = calculateRevenueAllocation({ total_value: 20 }, { now: fixedNow });

  assert.equal(allocation.owner_sweep, 10);
  assert.equal(allocation.status, 'HOLD_IN_BUSINESS_ACCOUNT');
});

test('rounds allocation outputs to cents before applying the sweep status', () => {
  const allocation = calculateRevenueAllocation({ total_value: '20.01' }, { now: fixedNow });

  assert.equal(allocation.owner_sweep, 10.01);
  assert.equal(allocation.status, 'READY_FOR_RTP');
});

test('rejects invalid total values', () => {
  assert.throws(() => calculateRevenueAllocation({}), /total_value must be a finite number/);
  assert.throws(() => calculateRevenueAllocation({ total_value: 'nope' }), /total_value must be a finite number/);
  assert.throws(() => calculateRevenueAllocation({ total_value: -1 }), /total_value must be greater than or equal to 0/);
});
