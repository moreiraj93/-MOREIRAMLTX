# MockJ by MLTXPRO

MockJ is the MLTXPRO-owned AI app for chat, Image Studio, Video Studio, Project Brain, billing, tokens, and saved creations.

## Local Development

Requirements: Node.js and npm.

```sh
npm i
npm run dev
```

## Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- Supabase
- Stripe

## Build

```sh
npm run build
```

## Stripe Revenue Allocation

The backend exposes `POST /api/stripe-webhook` for confirmed Stripe payment events.
Configure Stripe to send `invoice.paid` events to this endpoint and set
`STRIPE_WEBHOOK_SECRET` in the server environment.

Each paid invoice is written to `public.revenue_allocations` with exact-cent
allocation math:

- Deals over $10,000: 35% tax reserve, 15% ops fund, 50% owner sweep.
- Deals at or below $10,000: 25% tax reserve, 25% ops fund, 50% owner sweep.
- Owner sweeps of $10 or less are marked `HOLD_IN_BUSINESS_ACCOUNT`; larger
  sweeps are marked `READY_FOR_RTP`.
