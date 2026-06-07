import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const app = express();
const port = Number(process.env.PORT || 3000);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.resolve(__dirname, '../dist');

app.set('trust proxy', true);
app.use(express.json());

app.use('/api', (req, res, next) => {
  const origin = process.env.CORS_ORIGIN || req.get('origin') || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  next();
});

function requiredEnv(name, aliases = []) {
  for (const key of [name, ...aliases]) {
    const value = process.env[key];
    if (value) return value;
  }
  throw new Error(`${name} is not configured on the server`);
}

function stripeClient() {
  return new Stripe(requiredEnv('STRIPE_SECRET_KEY'), {
    apiVersion: '2026-02-25.clover',
  });
}

function supabaseAdminClient() {
  const url = requiredEnv('SUPABASE_URL', ['VITE_SUPABASE_URL']);
  const key = requiredEnv('SUPABASE_SERVICE_ROLE_KEY', [
    'SUPABASE_ANON_KEY',
    'VITE_SUPABASE_ANON_KEY',
  ]);

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function requireUser(req) {
  const authHeader = req.get('authorization');
  if (!authHeader) {
    const error = new Error('Authorization header not provided');
    error.statusCode = 401;
    throw error;
  }

  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    const error = new Error('Bearer token not provided');
    error.statusCode = 401;
    throw error;
  }

  const { data, error } = await supabaseAdminClient().auth.getUser(token);
  if (error) {
    const authError = new Error(`Authentication error: ${error.message}`);
    authError.statusCode = 401;
    throw authError;
  }

  if (!data.user?.email) {
    const emailError = new Error('User not authenticated or email unavailable');
    emailError.statusCode = 401;
    throw emailError;
  }

  return data.user;
}

function tierForPrice(priceId) {
  if (priceId && priceId === process.env.STRIPE_SALE_PRICE_ID) return 'sale';
  if (priceId && priceId === process.env.STRIPE_PRO_PRICE_ID) return 'pro';
  return 'pro';
}

async function findStripeCustomerByEmail(stripe, email) {
  const customers = await stripe.customers.list({ email, limit: 100 });
  return customers.data;
}

async function findActiveSubscription(stripe, email) {
  const customers = await findStripeCustomerByEmail(stripe, email);
  for (const customer of customers) {
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'all',
      limit: 100,
    });

    const active = subscriptions.data.find((subscription) =>
      ['active', 'trialing'].includes(subscription.status),
    );
    if (active) return { customer, subscription: active };
  }
  return null;
}

function subscriptionPayload(match) {
  if (!match) {
    return {
      subscribed: false,
      tier: 'free',
      subscription_end: null,
    };
  }

  const item = match.subscription.items.data[0];
  const priceId = item?.price?.id;
  const product = item?.price?.product;
  const productId = typeof product === 'string' ? product : product?.id ?? null;
  const subscriptionEnd = match.subscription.current_period_end
    ? new Date(match.subscription.current_period_end * 1000).toISOString()
    : null;

  return {
    subscribed: true,
    tier: tierForPrice(priceId),
    subscription_end: subscriptionEnd,
    product_id: productId,
  };
}

function requestOrigin(req) {
  return (
    process.env.PUBLIC_APP_URL ||
    process.env.ONSPACE_PUBLIC_URL ||
    req.get('origin') ||
    `${req.protocol}://${req.get('host')}`
  ).replace(/\/$/, '');
}

app.post('/api/check-subscription', async (req, res) => {
  try {
    const user = await requireUser(req);
    const stripe = stripeClient();
    const match = await findActiveSubscription(stripe, user.email);
    res.json(subscriptionPayload(match));
  } catch (error) {
    const status = error.statusCode || 500;
    res.status(status).json({ error: error.message || 'Failed to check subscription' });
  }
});

app.post('/api/create-checkout', async (req, res) => {
  try {
    const user = await requireUser(req);
    const plan = req.body?.plan === 'sale' ? 'sale' : 'pro';
    const priceId =
      plan === 'sale'
        ? process.env.STRIPE_SALE_PRICE_ID || process.env.STRIPE_PRO_PRICE_ID
        : process.env.STRIPE_PRO_PRICE_ID;

    if (!priceId) {
      res.status(500).json({ error: 'No Stripe price ID configured for this plan' });
      return;
    }

    const stripe = stripeClient();
    const customers = await findStripeCustomerByEmail(stripe, user.email);
    const customer =
      customers[0] ||
      (await stripe.customers.create({
        email: user.email,
        metadata: { user_id: user.id },
      }));

    const origin = requestOrigin(req);
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${origin}/success`,
      cancel_url: `${origin}/`,
    });

    res.json({ url: session.url });
  } catch (error) {
    const status = error.statusCode || 500;
    res.status(status).json({ error: error.message || 'Failed to create checkout session' });
  }
});

app.post('/api/customer-portal', async (req, res) => {
  try {
    const user = await requireUser(req);
    const stripe = stripeClient();
    const customers = await findStripeCustomerByEmail(stripe, user.email);
    const customer = customers[0];

    if (!customer) {
      res.status(404).json({ error: 'No Stripe customer found for this user' });
      return;
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customer.id,
      return_url: `${requestOrigin(req)}/`,
    });

    res.json({ url: session.url });
  } catch (error) {
    const status = error.statusCode || 500;
    res.status(status).json({ error: error.message || 'Failed to create customer portal session' });
  }
});

app.use(express.static(distPath));

app.use((req, res, next) => {
  if (req.method !== 'GET' || req.path.startsWith('/api/')) {
    next();
    return;
  }

  res.sendFile(path.join(distPath, 'index.html'), (error) => {
    if (error) res.status(404).send('Not found');
  });
});

app.listen(port, () => {
  console.log(`MockJ backend listening on port ${port}`);
});
