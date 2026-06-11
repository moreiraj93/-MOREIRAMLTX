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

## Revenue Allocation

The backend exposes a calculation-only treasury endpoint:

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
  "timestamp": "2026-06-11T11:02:21.100Z"
}
```

Allocation rules:

- Deals over $10,000: 35% tax reserve, 15% ops fund, 50% owner sweep.
- Deals up to and including $10,000: 25% tax reserve, 25% ops fund, 50% owner sweep.
- Owner sweeps of $10 or less return `HOLD_IN_BUSINESS_ACCOUNT`.
- Calculations are performed in cents and reconciled so the three allocations equal `total_processed`.

This endpoint does not initiate transfers. Map `owner_sweep` to a banking provider only after the downstream provider is configured with the required permissions, approvals, audit logging, and compliance review.

### Make.com Run Script snippet

```js
const totalValue = input.total_value;

function allocateRevenue(value) {
  if (value === null || value === undefined || value === "") {
    throw new Error("total_value is required");
  }

  const totalCents = Math.round(Number(value) * 100);
  if (!Number.isFinite(totalCents) || totalCents < 0) {
    throw new Error("total_value must be a non-negative number");
  }

  const isBigDeal = totalCents > 1000000;
  const taxRate = isBigDeal ? 0.35 : 0.25;
  const opsRate = isBigDeal ? 0.15 : 0.25;

  const taxCents = Math.round(totalCents * taxRate);
  const opsCents = Math.round(totalCents * opsRate);
  const ownerCents = totalCents - taxCents - opsCents;
  const dollars = (cents) => Number((cents / 100).toFixed(2));

  return {
    tax_reserve: dollars(taxCents),
    ops_fund: dollars(opsCents),
    owner_sweep: dollars(ownerCents),
    total_processed: dollars(totalCents),
    status: ownerCents > 1000 ? "READY_FOR_RTP" : "HOLD_IN_BUSINESS_ACCOUNT",
    timestamp: new Date().toISOString()
  };
}

return allocateRevenue(totalValue);
```
