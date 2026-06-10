import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  allocationRecordFromStripeEvent,
  allocationSourceFromStripeEvent,
  calculateRevenueAllocation,
} from './revenueAllocation.js';

describe('calculateRevenueAllocation', () => {
  it('uses the standard split at and below $10,000', () => {
    assert.deepEqual(calculateRevenueAllocation(10_000_00), {
      tier: 'standard',
      taxRate: 0.25,
      opsRate: 0.25,
      ownerRate: 0.5,
      taxReserveCents: 250_000,
      opsFundCents: 250_000,
      ownerSweepCents: 500_000,
      status: 'READY_FOR_RTP',
    });
  });

  it('uses the large-deal split above $10,000', () => {
    assert.deepEqual(calculateRevenueAllocation(10_000_01), {
      tier: 'large_deal',
      taxRate: 0.35,
      opsRate: 0.15,
      ownerRate: 0.5,
      taxReserveCents: 350_000,
      opsFundCents: 150_000,
      ownerSweepCents: 500_001,
      status: 'READY_FOR_RTP',
    });
  });

  it('holds owner sweeps at $10 or less', () => {
    assert.equal(
      calculateRevenueAllocation(20_00).status,
      'HOLD_IN_BUSINESS_ACCOUNT',
    );
    assert.equal(
      calculateRevenueAllocation(20_02).status,
      'READY_FOR_RTP',
    );
  });

  it('keeps rounded cents balanced to the original total', () => {
    const allocation = calculateRevenueAllocation(33_33);

    assert.equal(
      allocation.taxReserveCents + allocation.opsFundCents + allocation.ownerSweepCents,
      33_33,
    );
    assert.deepEqual(
      {
        taxReserveCents: allocation.taxReserveCents,
        opsFundCents: allocation.opsFundCents,
        ownerSweepCents: allocation.ownerSweepCents,
      },
      {
        taxReserveCents: 833,
        opsFundCents: 833,
        ownerSweepCents: 1667,
      },
    );
  });

  it('rejects invalid totals', () => {
    assert.throws(() => calculateRevenueAllocation(-1), /non-negative integer/);
    assert.throws(() => calculateRevenueAllocation(10.5), /non-negative integer/);
  });
});

describe('allocationSourceFromStripeEvent', () => {
  it('extracts paid invoices', () => {
    const source = allocationSourceFromStripeEvent({
      type: 'invoice.paid',
      data: {
        object: {
          id: 'in_123',
          status: 'paid',
          amount_paid: 50_99,
          currency: 'usd',
          customer: 'cus_123',
          subscription: 'sub_123',
          created: 1_780_000_000,
          lines: {
            data: [{ price: { id: 'price_123' } }],
          },
        },
      },
    });

    assert.deepEqual(source, {
      stripeObjectId: 'in_123',
      stripeObjectType: 'invoice',
      stripeInvoiceId: 'in_123',
      stripeCheckoutSessionId: null,
      stripeCustomerId: 'cus_123',
      stripeSubscriptionId: 'sub_123',
      stripePriceId: 'price_123',
      currency: 'usd',
      totalAmountCents: 50_99,
      stripeCreatedAt: '2026-05-26T17:46:40.000Z',
    });
  });

  it('ignores checkout sessions that will be represented by an invoice', () => {
    const source = allocationSourceFromStripeEvent({
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_123',
          payment_status: 'paid',
          invoice: 'in_123',
          amount_total: 50_99,
          currency: 'usd',
        },
      },
    });

    assert.equal(source, null);
  });
});

describe('allocationRecordFromStripeEvent', () => {
  it('builds a ledger row from a confirmed Stripe event', () => {
    const event = {
      id: 'evt_123',
      type: 'invoice.paid',
      data: {
        object: {
          id: 'in_123',
          status: 'paid',
          amount_paid: 20_00,
          currency: 'USD',
          customer: { id: 'cus_123' },
          subscription: { id: 'sub_123' },
          created: 1_780_000_000,
          lines: {
            data: [{ price: { id: 'price_123' } }],
          },
        },
      },
    };

    assert.deepEqual(allocationRecordFromStripeEvent(event), {
      stripe_event_id: 'evt_123',
      stripe_event_type: 'invoice.paid',
      stripe_object_id: 'in_123',
      stripe_object_type: 'invoice',
      stripe_invoice_id: 'in_123',
      stripe_checkout_session_id: null,
      stripe_customer_id: 'cus_123',
      stripe_subscription_id: 'sub_123',
      stripe_price_id: 'price_123',
      currency: 'usd',
      total_amount_cents: 20_00,
      tax_reserve_cents: 500,
      ops_fund_cents: 500,
      owner_sweep_cents: 1000,
      tax_rate: 0.25,
      ops_rate: 0.25,
      owner_rate: 0.5,
      allocation_tier: 'standard',
      status: 'HOLD_IN_BUSINESS_ACCOUNT',
      stripe_created_at: '2026-05-26T17:46:40.000Z',
      raw_event: event,
    });
  });
});
