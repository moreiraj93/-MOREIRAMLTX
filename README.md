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

## Revenue Allocation API

Use `POST /api/revenue-allocation` to calculate treasury buckets for a deal before mapping outputs into Make.com, Mercury, Stripe, or Slack automations. The endpoint only calculates the allocation; it does not move money or require banking API keys.

Payloads can be sent directly or wrapped in an `input` object:

```json
{ "total_value": 12000 }
```

```json
{ "input": { "total_value": "12000" } }
```

Deals over $10,000 allocate 35% to taxes, 15% to ops, and 50% to owner sweep. Smaller deals allocate 25% to taxes, 25% to ops, and 50% to owner sweep. Owner sweeps of $10 or less return `HOLD_IN_BUSINESS_ACCOUNT`; larger sweeps return `READY_FOR_RTP`.
