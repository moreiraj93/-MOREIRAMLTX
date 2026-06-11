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

## Revenue allocation

The backend exposes a calculation-only treasury endpoint for automations:

```http
POST /api/revenue-allocation
Content-Type: application/json

{ "total_value": 12000 }
```

Response:

```json
{
  "tax_reserve": 4200,
  "ops_fund": 1800,
  "owner_sweep": 6000,
  "total_processed": 12000,
  "status": "READY_FOR_RTP",
  "timestamp": "2026-06-11T05:00:00.000Z"
}
```

Allocation rules:

- Deals over `$10,000`: 35% tax reserve, 15% ops fund, 50% owner sweep.
- Deals of `$10,000` or less: 25% tax reserve, 25% ops fund, 50% owner sweep.
- Owner sweeps of `$10` or less return `HOLD_IN_BUSINESS_ACCOUNT`; larger sweeps return `READY_FOR_RTP`.

In Make.com, map the `owner_sweep` response field into the Mercury/Stripe amount field only when `status` is `READY_FOR_RTP`.
