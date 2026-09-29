# lib/finance/

Pure calculation functions with Vitest unit tests. No I/O, no imports from lib/sheets.

- `money.ts` — toCents, fromCents, addCents, formatSGD
- `frequency.ts` — toMonthlyCents(amount, frequency)
- `renewals.ts` — nextRenewalDate, isRenewingSoon
- `goals.ts` — savedCents, monthsRemaining, requiredMonthlyCents, goalHealth, progress
- `allocation.ts` — buildAllocation (full zero-based budget calculation)
