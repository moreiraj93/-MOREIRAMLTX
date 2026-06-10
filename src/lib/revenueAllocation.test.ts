import { describe, expect, it } from 'vitest';
import { allocateRevenue } from './revenueAllocation';

const fixedTimestamp = new Date('2026-06-10T09:02:28.981Z');

describe('allocateRevenue', () => {
  it('uses smaller deal rates when total_value is at the threshold', () => {
    expect(allocateRevenue({ total_value: 10000 }, fixedTimestamp)).toEqual({
      tax_reserve: 2500,
      ops_fund: 2500,
      owner_sweep: 5000,
      total_processed: 10000,
      status: 'READY_FOR_RTP',
      timestamp: '2026-06-10T09:02:28.981Z',
    });
  });

  it('uses larger deal rates only when total_value is over the threshold', () => {
    expect(allocateRevenue({ total_value: 12000 }, fixedTimestamp)).toEqual({
      tax_reserve: 4200,
      ops_fund: 1800,
      owner_sweep: 6000,
      total_processed: 12000,
      status: 'READY_FOR_RTP',
      timestamp: '2026-06-10T09:02:28.981Z',
    });
  });

  it('rounds allocation amounts to cents', () => {
    expect(allocateRevenue({ total_value: 333.33 }, fixedTimestamp)).toMatchObject({
      tax_reserve: 83.33,
      ops_fund: 83.33,
      owner_sweep: 166.67,
      total_processed: 333.33,
    });
  });

  it('holds owner sweeps that are $10 or less', () => {
    expect(allocateRevenue({ total_value: 20 }, fixedTimestamp).status).toBe('HOLD_IN_BUSINESS_ACCOUNT');
    expect(allocateRevenue({ total_value: 20.02 }, fixedTimestamp).status).toBe('READY_FOR_RTP');
  });

  it('accepts numeric string input from automation payloads', () => {
    expect(allocateRevenue({ total_value: '15000.50' }, fixedTimestamp)).toMatchObject({
      tax_reserve: 5250.18,
      ops_fund: 2250.08,
      owner_sweep: 7500.25,
      total_processed: 15000.5,
      status: 'READY_FOR_RTP',
    });
  });

  it.each([
    [Number.NaN],
    [Infinity],
    [''],
    ['not-a-number'],
    [-1],
  ])('rejects invalid total_value %p', (totalValue) => {
    expect(() => allocateRevenue({ total_value: totalValue }, fixedTimestamp)).toThrow();
  });
});
