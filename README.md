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

The backend exposes a stateless allocation helper for treasury automations:

```sh
POST /api/revenue-allocation
Content-Type: application/json

{ "total_value": 12500 }
```

Deals over $10,000 reserve 35% for taxes, 15% for operations, and 50% for owner
sweep. Smaller deals reserve 25% for taxes, 25% for operations, and 50% for owner
sweep. The response includes rounded currency values and returns
`HOLD_IN_BUSINESS_ACCOUNT` unless the owner sweep is greater than $10.
