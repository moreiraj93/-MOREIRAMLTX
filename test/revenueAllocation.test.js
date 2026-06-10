import assert from 'node:assert/strict';
import http from 'node:http';
import test from 'node:test';

import { app } from '../server/index.js';
import { calculateRevenueAllocation } from '../server/revenueAllocation.js';

const fixedNow = new Date('2026-06-10T01:02:11.463Z');

async function startTestServer(t) {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => server.close());

  const address = server.address();
  return `http://${address.address}:${address.port}`;
}

test('allocates standard deals at 25% tax, 25% ops, and 50% owner', () => {
  assert.deepEqual(calculateRevenueAllocation({ total_value: 10000 }, { now: fixedNow }), {
    tax_reserve: 2500,
    ops_fund: 2500,
    owner_sweep: 5000,
    total_processed: 10000,
    status: 'READY_FOR_RTP',
    timestamp: '2026-06-10T01:02:11.463Z',
  });
});

test('allocates big deals at 35% tax, 15% ops, and 50% owner', () => {
  assert.deepEqual(calculateRevenueAllocation({ total_value: 12000 }, { now: fixedNow }), {
    tax_reserve: 4200,
    ops_fund: 1800,
    owner_sweep: 6000,
    total_processed: 12000,
    status: 'READY_FOR_RTP',
    timestamp: '2026-06-10T01:02:11.463Z',
  });
});

test('holds owner sweep when the rounded sweep is not greater than $10', () => {
  assert.equal(
    calculateRevenueAllocation({ total_value: 20 }, { now: fixedNow }).status,
    'HOLD_IN_BUSINESS_ACCOUNT',
  );
  assert.equal(
    calculateRevenueAllocation({ total_value: 20.02 }, { now: fixedNow }).status,
    'READY_FOR_RTP',
  );
});

test('accepts numeric strings from automation tools', () => {
  assert.deepEqual(calculateRevenueAllocation({ total_value: '250.50' }, { now: fixedNow }), {
    tax_reserve: 62.63,
    ops_fund: 62.63,
    owner_sweep: 125.25,
    total_processed: 250.5,
    status: 'READY_FOR_RTP',
    timestamp: '2026-06-10T01:02:11.463Z',
  });
});

test('rejects invalid totals before producing allocation output', () => {
  assert.throws(
    () => calculateRevenueAllocation({ total_value: -1 }, { now: fixedNow }),
    /greater than or equal to 0/,
  );
  assert.throws(
    () => calculateRevenueAllocation({ total_value: 'not-a-number' }, { now: fixedNow }),
    /finite number/,
  );
});

test('POST /api/revenue-allocation returns Make-compatible allocation output', async (t) => {
  const baseUrl = await startTestServer(t);
  const response = await fetch(`${baseUrl}/api/revenue-allocation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ total_value: 12000 }),
  });

  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.tax_reserve, 4200);
  assert.equal(payload.ops_fund, 1800);
  assert.equal(payload.owner_sweep, 6000);
  assert.equal(payload.total_processed, 12000);
  assert.equal(payload.status, 'READY_FOR_RTP');
  assert.match(payload.timestamp, /^\d{4}-\d{2}-\d{2}T/);
});

test('POST /api/revenue-allocation returns 400 for invalid input', async (t) => {
  const baseUrl = await startTestServer(t);
  const response = await fetch(`${baseUrl}/api/revenue-allocation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ total_value: null }),
  });

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error: 'total_value must be a finite number',
  });
});
