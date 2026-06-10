create extension if not exists "pgcrypto";

create table if not exists public.revenue_allocations (
  id uuid primary key default gen_random_uuid(),
  stripe_event_id text not null unique,
  stripe_event_type text not null,
  stripe_object_id text not null unique,
  stripe_object_type text not null,
  stripe_invoice_id text,
  stripe_checkout_session_id text,
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_price_id text,
  currency text not null,
  total_amount_cents bigint not null check (total_amount_cents >= 0),
  tax_reserve_cents bigint not null check (tax_reserve_cents >= 0),
  ops_fund_cents bigint not null check (ops_fund_cents >= 0),
  owner_sweep_cents bigint not null check (owner_sweep_cents >= 0),
  tax_rate numeric(6, 4) not null,
  ops_rate numeric(6, 4) not null,
  owner_rate numeric(6, 4) not null,
  allocation_tier text not null check (allocation_tier in ('standard', 'large_deal')),
  status text not null check (status in ('READY_FOR_RTP', 'HOLD_IN_BUSINESS_ACCOUNT')),
  stripe_created_at timestamptz,
  processed_at timestamptz not null default now(),
  raw_event jsonb not null
);

alter table public.revenue_allocations enable row level security;

create index if not exists revenue_allocations_processed_at_idx
  on public.revenue_allocations (processed_at desc);

create index if not exists revenue_allocations_status_idx
  on public.revenue_allocations (status);

create index if not exists revenue_allocations_customer_idx
  on public.revenue_allocations (stripe_customer_id);
