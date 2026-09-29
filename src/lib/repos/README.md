# lib/repos/

Repository layer — one file per sheet tab. Wraps `lib/sheets/table.ts` with Next.js tag-based caching.

Files: `income.ts`, `subscriptions.ts`, `budget.ts`, `goals.ts`, `contributions.ts`, `settings.ts`

Also exports a `loadAll()` batch loader that reads every tab in a single `batchGet` call (for the dashboard).
