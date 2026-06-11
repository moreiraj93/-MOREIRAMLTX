# Revenue Allocation Logic

This documents the treasury split used for incoming deal revenue before any owner sweep is mapped into a banking provider.

## Tiers

- Deals over `$10,000`: `35%` tax reserve, `15%` ops fund, `50%` owner sweep.
- Deals at or under `$10,000`: `25%` tax reserve, `25%` ops fund, `50%` owner sweep.
- Owner sweeps of `$10.00` or less stay in the business account.

The app implementation lives in `src/lib/revenueAllocation.ts`.

## Make.com Run Script

Paste this version into a Make.com **Run Script** module. Map the module output field `owner_sweep` into the Mercury/Stripe amount field only after confirming the banking API key has write permissions in the target environment.

```js
const totalValue = Number(input.total_value);

if (!Number.isFinite(totalValue) || totalValue < 0) {
  throw new Error('total_value must be a finite, non-negative number.');
}

const totalProcessed = Number(totalValue.toFixed(2));
const isHighValueDeal = totalValue > 10000;

const taxRate = isHighValueDeal ? 0.35 : 0.25;
const opsRate = isHighValueDeal ? 0.15 : 0.25;
const ownerRate = 0.5;

const roundCurrency = (value) => Number((Math.round((value + Number.EPSILON) * 100) / 100).toFixed(2));

const taxReserve = roundCurrency(totalProcessed * taxRate);
const opsFund = roundCurrency(totalProcessed * opsRate);
const ownerSweep = roundCurrency(totalProcessed * ownerRate);

return {
  tax_reserve: taxReserve,
  ops_fund: opsFund,
  owner_sweep: ownerSweep,
  total_processed: totalProcessed,
  status: ownerSweep > 10 ? 'READY_FOR_RTP' : 'HOLD_IN_BUSINESS_ACCOUNT',
  timestamp: new Date().toISOString(),
};
```

## Slack Notification Template

```text
Yo! The Treasury just swept ${{owner_sweep}} into your personal vault. Instant settlement. No waiting.
```

## Operational Notes

- Keep API keys out of Make.com logs and this repository.
- Use a dry-run scenario before enabling write access for money movement.
- Confirm large-transaction reporting and recordkeeping requirements with finance or tax counsel.
