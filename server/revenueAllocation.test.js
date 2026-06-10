import assert from 'node:assert/strict';
import test from 'node:test';

import {
  allocateRevenue,
  allocationRatesFor,
  parseTotalValue,
  REVENUE_ALLOCATION_STATUS,
} from './revenueAllocation.js';

const FIXED_TIMESTAMP = '2026-06-10T00:00:00.000Z';

test('allocates smaller deals with 25% tax, 25% ops, and 50% owner split', () => {
  assert.deepEqual(allocateRevenue({ total_value: 8000 }, FIXED_TIMESTAMP), {
    tax_reserve: 2000,
    ops_fund: 2000,
    owner_sweep: 4000,
    total_processed: 8000,
    status: REVENUE_ALLOCATION_STATUS.readyForRtp,
    timestamp: FIXED_TIMESTAMP,
  });
});

test('allocates deals over 10000 with higher tax reserve and lower ops reserve', () => {
  assert.deepEqual(allocateRevenue({ total_value: 12000 }, FIXED_TIMESTAMP), {
    tax_reserve: 4200,
    ops_fund: 1800,
    owner_sweep: 6000,
    total_processed: 12000,
    status: REVENUE_ALLOCATION_STATUS.readyForRtp,
    timestamp: FIXED_TIMESTAMP,
  });
});

test('uses the smaller-deal tier at exactly 10000', () => {
  assert.deepEqual(allocationRatesFor(10000), {
    tax: 0.25,
    operations: 0.25,
    owner: 0.5,
  });
});

test('holds owner sweep amounts of 10 dollars or less', () => {
  assert.equal(
    allocateRevenue({ total_value: 20 }, FIXED_TIMESTAMP).status,
    REVENUE_ALLOCATION_STATUS.holdInBusinessAccount,
  );
  assert.equal(
    allocateRevenue({ total_value: 20.02 }, FIXED_TIMESTAMP).status,
    REVENUE_ALLOCATION_STATUS.readyForRtp,
  );
});

test('rounds allocation amounts to two currency decimals', () => {
  assert.deepEqual(allocateRevenue({ total_value: 99.99 }, FIXED_TIMESTAMP), {
    tax_reserve: 25,
    ops_fund: 25,
    owner_sweep: 49.99,
    total_processed: 99.99,
    status: REVENUE_ALLOCATION_STATUS.readyForRtp,
    timestamp: FIXED_TIMESTAMP,
  });
});

test('accepts numeric strings from automation payloads', () => {
  assert.equal(parseTotalValue('123.45'), 123.45);
});

test('rejects missing, non-numeric, and negative totals', () => {
  assert.throws(() => allocateRevenue({}, FIXED_TIMESTAMP), /total_value must be a finite number/);
  assert.throws(() => allocateRevenue({ total_value: 'nope' }, FIXED_TIMESTAMP), /finite number/);
  assert.throws(
    () => allocateRevenue({ total_value: -1 }, FIXED_TIMESTAMP),
    /greater than or equal to 0/,
  );
});
