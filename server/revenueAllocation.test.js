import test from 'node:test';
import assert from 'node:assert/strict';
import { allocateRevenue, allocationInputFromRequest } from './revenueAllocation.js';

const fixedNow = new Date('2026-06-09T22:03:00.000Z');

test('allocates smaller deals with 25% tax, 25% ops, and 50% owner sweep', () => {
  assert.deepEqual(allocateRevenue(1000, { now: fixedNow }), {
    tax_reserve: 250,
    ops_fund: 250,
    owner_sweep: 500,
    total_processed: 1000,
    status: 'READY_FOR_RTP',
    timestamp: '2026-06-09T22:03:00.000Z',
  });
});

test('allocates deals over 10000 with the large-deal reserve rates', () => {
  assert.deepEqual(allocateRevenue(12000, { now: fixedNow }), {
    tax_reserve: 4200,
    ops_fund: 1800,
    owner_sweep: 6000,
    total_processed: 12000,
    status: 'READY_FOR_RTP',
    timestamp: '2026-06-09T22:03:00.000Z',
  });
});

test('uses the smaller-deal rates at exactly 10000', () => {
  assert.deepEqual(allocateRevenue(10000, { now: fixedNow }), {
    tax_reserve: 2500,
    ops_fund: 2500,
    owner_sweep: 5000,
    total_processed: 10000,
    status: 'READY_FOR_RTP',
    timestamp: '2026-06-09T22:03:00.000Z',
  });
});

test('holds owner sweep amounts that are not greater than 10 dollars', () => {
  assert.equal(allocateRevenue(20, { now: fixedNow }).owner_sweep, 10);
  assert.equal(allocateRevenue(20, { now: fixedNow }).status, 'HOLD_IN_BUSINESS_ACCOUNT');
  assert.equal(allocateRevenue(20.02, { now: fixedNow }).owner_sweep, 10.01);
  assert.equal(allocateRevenue(20.02, { now: fixedNow }).status, 'READY_FOR_RTP');
});

test('rounds allocation amounts to cents', () => {
  assert.deepEqual(allocateRevenue(19.99, { now: fixedNow }), {
    tax_reserve: 5,
    ops_fund: 5,
    owner_sweep: 10,
    total_processed: 19.99,
    status: 'HOLD_IN_BUSINESS_ACCOUNT',
    timestamp: '2026-06-09T22:03:00.000Z',
  });
});

test('accepts Make-style snake_case request input', () => {
  assert.equal(allocationInputFromRequest({ total_value: '123.45' }), '123.45');
});

test('rejects invalid totals', () => {
  assert.throws(() => allocateRevenue(undefined), /finite number/);
  assert.throws(() => allocateRevenue('not-a-number'), /finite number/);
  assert.throws(() => allocateRevenue(-1), /zero or greater/);
});
