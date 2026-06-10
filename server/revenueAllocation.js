const LARGE_DEAL_THRESHOLD_CENTS = 1_000_000;
const MIN_OWNER_SWEEP_CENTS = 1_000;

const ALLOCATION_RATES = {
  large_deal: {
    taxRate: 0.35,
    opsRate: 0.15,
    ownerRate: 0.5,
  },
  standard: {
    taxRate: 0.25,
    opsRate: 0.25,
    ownerRate: 0.5,
  },
};

function roundCents(amountCents, rate) {
  return Math.round(amountCents * rate);
}

export function calculateRevenueAllocation(totalAmountCents) {
  if (!Number.isInteger(totalAmountCents) || totalAmountCents < 0) {
    throw new Error('totalAmountCents must be a non-negative integer');
  }

  const tier = totalAmountCents > LARGE_DEAL_THRESHOLD_CENTS ? 'large_deal' : 'standard';
  const rates = ALLOCATION_RATES[tier];
  const taxReserveCents = roundCents(totalAmountCents, rates.taxRate);
  const opsFundCents = roundCents(totalAmountCents, rates.opsRate);
  const ownerSweepCents = totalAmountCents - taxReserveCents - opsFundCents;

  return {
    tier,
    taxRate: rates.taxRate,
    opsRate: rates.opsRate,
    ownerRate: rates.ownerRate,
    taxReserveCents,
    opsFundCents,
    ownerSweepCents,
    status: ownerSweepCents > MIN_OWNER_SWEEP_CENTS
      ? 'READY_FOR_RTP'
      : 'HOLD_IN_BUSINESS_ACCOUNT',
  };
}

function unixSecondsToIso(value) {
  return typeof value === 'number' ? new Date(value * 1000).toISOString() : null;
}

function invoiceAllocationSource(invoice) {
  const paid = invoice.status === 'paid' || invoice.paid === true;
  const amountPaid = invoice.amount_paid ?? invoice.amount_due;

  if (!paid || !Number.isInteger(amountPaid) || amountPaid <= 0) {
    return null;
  }

  const line = Array.isArray(invoice.lines?.data) ? invoice.lines.data[0] : null;
  const price = line?.price;

  return {
    stripeObjectId: invoice.id,
    stripeObjectType: 'invoice',
    stripeInvoiceId: invoice.id,
    stripeCheckoutSessionId: null,
    stripeCustomerId: typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id ?? null,
    stripeSubscriptionId: typeof invoice.subscription === 'string'
      ? invoice.subscription
      : invoice.subscription?.id ?? null,
    stripePriceId: typeof price === 'string' ? price : price?.id ?? null,
    currency: invoice.currency,
    totalAmountCents: amountPaid,
    stripeCreatedAt: unixSecondsToIso(invoice.created),
  };
}

function checkoutSessionAllocationSource(session) {
  const amountTotal = session.amount_total;

  if (
    session.payment_status !== 'paid'
    || session.invoice
    || !Number.isInteger(amountTotal)
    || amountTotal <= 0
  ) {
    return null;
  }

  return {
    stripeObjectId: session.id,
    stripeObjectType: 'checkout.session',
    stripeInvoiceId: null,
    stripeCheckoutSessionId: session.id,
    stripeCustomerId: typeof session.customer === 'string' ? session.customer : session.customer?.id ?? null,
    stripeSubscriptionId: typeof session.subscription === 'string'
      ? session.subscription
      : session.subscription?.id ?? null,
    stripePriceId: null,
    currency: session.currency,
    totalAmountCents: amountTotal,
    stripeCreatedAt: unixSecondsToIso(session.created),
  };
}

export function allocationSourceFromStripeEvent(event) {
  const dataObject = event?.data?.object;

  if (!dataObject) return null;

  if (event.type === 'invoice.paid') {
    return invoiceAllocationSource(dataObject);
  }

  if (event.type === 'checkout.session.completed') {
    return checkoutSessionAllocationSource(dataObject);
  }

  return null;
}

export function allocationRecordFromStripeEvent(event) {
  const source = allocationSourceFromStripeEvent(event);
  if (!source) return null;

  if (!source.currency) {
    throw new Error(`Stripe ${source.stripeObjectType} ${source.stripeObjectId} is missing currency`);
  }

  const allocation = calculateRevenueAllocation(source.totalAmountCents);

  return {
    stripe_event_id: event.id,
    stripe_event_type: event.type,
    stripe_object_id: source.stripeObjectId,
    stripe_object_type: source.stripeObjectType,
    stripe_invoice_id: source.stripeInvoiceId,
    stripe_checkout_session_id: source.stripeCheckoutSessionId,
    stripe_customer_id: source.stripeCustomerId,
    stripe_subscription_id: source.stripeSubscriptionId,
    stripe_price_id: source.stripePriceId,
    currency: source.currency.toLowerCase(),
    total_amount_cents: source.totalAmountCents,
    tax_reserve_cents: allocation.taxReserveCents,
    ops_fund_cents: allocation.opsFundCents,
    owner_sweep_cents: allocation.ownerSweepCents,
    tax_rate: allocation.taxRate,
    ops_rate: allocation.opsRate,
    owner_rate: allocation.ownerRate,
    allocation_tier: allocation.tier,
    status: allocation.status,
    stripe_created_at: source.stripeCreatedAt,
    raw_event: event,
  };
}
