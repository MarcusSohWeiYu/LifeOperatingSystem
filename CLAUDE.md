# Life OS — project context for Claude Code

A personal Life Operating System for one user (Marcus, Singapore, SGD).
Currently has two modules: **Finance** (planning, not transaction tracking) and **Fitness** (nutrition logging).

---

## Modules

### Finance (`/finance/*`)
Planning where income goes, what subscriptions cost, and how much to set aside each month to hit goals.
- **Subscriptions** — recurring costs, normalised to monthly, with "renewing soon" alerts
- **Income & allocation** — zero-based budgeting: allocate income to categories, subscriptions, and goals; aim for $0 unallocated
- **Goals** — trips and purchases with target amount + date; required monthly saving, progress, health status
- **Dashboard** — one-page summary of all the above
- **Planner** — "what-if" sandbox (never writes to sheet)

### Fitness (`/fitness/*`)
- **Nutrition** — daily food logging, macros tracking (calories, protein, carbs, fat). Local state (no sheet). FatSecret API for food search and barcode lookup.
- Future: workouts, sleep, etc. (placeholders exist)

---

## Stack (do not swap without asking)
- Next.js (latest stable, App Router, `src/` dir), TypeScript `strict`, npm
- Tailwind CSS + shadcn/ui, lucide-react icons
- `googleapis` (Google Sheets API v4) with a **service account**
- `zod` for schemas and env validation; `react-hook-form` + `@hookform/resolvers` for forms
- `date-fns` for dates, `recharts` for charts
- `vitest` for unit tests, `tsx` to run scripts
- `@ericblade/quagga2` for barcode scanning (camera, no native app)
- No auth, no ORM, no other database. Ask before adding any other dependency.

---

## Hosting model
- Runs **locally only** on the user's Mac. Bind to localhost: `next dev -H 127.0.0.1` and `next start -H 127.0.0.1 -p 3000`.
- There is no login, so the app must never be exposed publicly. Do not add tunnels, public deploy configs or `0.0.0.0` bindings.

---

## Architecture rules

### Finance (Google Sheets)
- **The Google Sheet is the database.** Each tab is a table; row 1 is the header; every row has an `id` (UUID) in column A.
- **Only `src/lib/sheets/**` imports `googleapis`.** Everything else goes through the repositories in `src/lib/repos/`.
- All Sheets code is server-only: start those files with `import "server-only"`. Never import them into client components.
- **The sheet stores raw data only — no formulas.** All calculations live in pure functions in `src/lib/finance/`, with Vitest tests.
- Pages are Server Components that read via repos. Mutations use **Server Actions** in `src/actions/`, validate input with zod, then revalidate the affected tab's cache tag.
- Cache reads per tab with Next's tag-based caching (tag = tab name, e.g. `sheet:Goals`). Use whichever tag-caching API the installed Next.js version recommends. Invalidate on every write.
- Read all tabs the dashboard needs in **one** `spreadsheets.values.batchGet` call (Sheets API allows about 60 reads per minute).
- For update/delete, look up the row index by `id` fresh at write time. Never trust cached row numbers.
- Read with `valueRenderOption: "UNFORMATTED_VALUE"`. Write with `valueInputOption: "RAW"` so Sheets does not auto-convert dates or strings.
- Validate headers at startup/first read: if a tab's header row doesn't match the schema, throw a clear error that says to run `npm run sheets:init`.

### Fitness / Nutrition (local state)
- Nutrition data lives in **localStorage** only (`loadNutritionState` / `saveNutritionState` in `src/components/nutrition/utils.ts`). No sheet tab.
- Food search and barcode lookup use **FatSecret API** (server-side only — OAuth 2.0 client credentials). All FatSecret calls go through `src/actions/nutrition.ts` (server actions) so credentials never reach the client.
- `src/lib/fatsecret.ts` — marked `import "server-only"`. Caches OAuth token in module-level variable (refresh 60s before expiry).
- Add food dialog has four tabs: Search (FatSecret text search), Quick Add (manual entry with name), Scan (quagga2 barcode → FatSecret lookup), AI (placeholder).

---

## Data conventions
- Money: stored in the sheet as plain numbers in dollars (e.g. `12.98`). In TypeScript, do arithmetic in **integer cents** (`src/lib/finance/money.ts`) and format with `Intl.NumberFormat("en-SG", { style: "currency", currency: "SGD" })`.
- Dates: stored as ISO strings `YYYY-MM-DD`. Timestamps (`createdAt`, `updatedAt`) as ISO 8601. Timezone: `Asia/Singapore`.
- Booleans: `TRUE` / `FALSE`.
- Enums are lowercase strings (see schema).
- Empty trailing cells come back missing from the API — the parser must treat missing as empty.

---

## Sheet schema (tab → columns, in this exact order)
| Tab | Columns |
|---|---|
| `Income` | id, name, amount, frequency, active, notes, createdAt, updatedAt |
| `Subscriptions` | id, name, amount, frequency, category, nextRenewal, paymentMethod, active, notes, createdAt, updatedAt |
| `Budget` | id, category, plannedMonthly, type, notes, createdAt, updatedAt |
| `Goals` | id, name, type, targetAmount, targetDate, priority, status, notes, createdAt, updatedAt |
| `Contributions` | id, goalId, amount, date, note, createdAt |
| `Settings` | key, value |

Enums:
- `frequency`: `weekly` | `fortnightly` | `monthly` | `quarterly` | `yearly`
- Budget `type`: `needs` | `wants` | `savings`
- Goal `type`: `trip` | `purchase` | `other`
- Goal `status`: `active` | `completed` | `cancelled`
- `priority`: integer, 1 = highest
- Settings keys: `currency` (default `SGD`), `renewalAlertDays` (default `7`)

A goal's "saved so far" = sum of its `Contributions`. It is never stored on the goal row.

---

## Finance rules (implement exactly; unit-test each)
- **Monthly equivalent:** weekly ×52/12, fortnightly ×26/12, monthly ×1, quarterly ÷3, yearly ÷12. Round to cents.
- **Months remaining** for a goal (today in SGT): `(targetYear − thisYear) × 12 + (targetMonth − thisMonth)`, minimum 1 if the target date is today or later. If the target date is in the past → 0 and status `overdue`.
- **Required monthly saving:** `max(0, target − saved) / monthsRemaining`, rounded **up** to the cent. 0 if reached.
- **Goal health:** `reached` (saved ≥ target) · `overdue` (past date, not reached) · `on-track` (contributions this calendar month ≥ required monthly) · `behind` (otherwise).
- **Allocation:** `unallocated = monthly income − subscriptions (active) − budget planned − required monthly for active goals`. Negative → "over-allocated" warning.
- **Priority funding:** when over-allocated, fund goals in priority order (then earliest target date) with the money left after subscriptions and budget. Report which goals are fully funded, partly funded or unfunded.
- **Next renewal:** if the stored `nextRenewal` is in the past, roll it forward by the subscription's frequency until it is today or later. Show as "renewing soon" if within `renewalAlertDays`.

---

## Folder layout
```
src/
  app/
    page.tsx                  # Life OS overview (module switcher)
    finance/                  # Finance module routes
      layout.tsx
      page.tsx                # Dashboard
      subscriptions/
      income/
      budget/
      goals/
        [id]/
      planner/
    fitness/                  # Fitness module routes
      layout.tsx
      page.tsx                # Fitness overview
      nutrition/
        page.tsx
  components/
    ui/                       # shadcn components
    module-config.ts          # ModuleConfig type + modules array
    module-switcher.tsx       # DropdownMenu for switching modules
    app-sidebar.tsx
    mobile-nav.tsx
    theme-toggle.tsx
    allocation-strip.tsx
    delete-confirm-dialog.tsx
    budget/
    goals/
    income/
    planner/
    subscriptions/
    nutrition/                # All nutrition components (client state)
  actions/                    # Server actions per entity
    nutrition.ts              # FatSecret search/barcode (server-only)
  lib/
    env.ts                    # zod-validated env (server-only)
    sheets/                   # client.ts, table.ts, schema.ts
    repos/                    # income.ts, subscriptions.ts, budget.ts, goals.ts, contributions.ts, settings.ts
    finance/                  # money.ts, frequency.ts, goals.ts, allocation.ts, renewals.ts (+ *.test.ts)
    fatsecret.ts              # FatSecret API client (server-only)
scripts/                      # sheets-check.ts, sheets-init.ts, sheets-seed.ts
```

---

## Environment (`.env.local`, git-ignored)
```
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEET_ID=
FATSECRET_CLIENT_ID=
FATSECRET_CLIENT_SECRET=
```
- Commit `.env.example` with empty values only.
- `GOOGLE_PRIVATE_KEY` must have `\n` converted to real newlines (`.replace(/\\n/g, "\n")`).
- **Never** print, log, echo or commit the private key or `.env.local`. Never write real credentials into any file.

---

## npm scripts
`dev`, `build`, `start` (localhost-bound), `lint`, `typecheck` (`tsc --noEmit`), `test` (`vitest run`),
`sheets:check`, `sheets:init`, `sheets:seed`, `verify` (= typecheck + lint + test + build).

---

## Git commit practices
- **Never commit everything in one commit.** Group changes into logical, self-contained commits.
- **One commit per concern:** UI changes, data/logic changes, config changes, and dependency additions each belong in separate commits where the diff tells a coherent story.
- **Commit message format:** `<type>: <short imperative summary>` followed by a blank line and 2–4 sentence body explaining the *why* and key decisions.
  - Types: `feat` (new feature), `refactor` (restructure without behaviour change), `fix` (bug fix), `chore` (config/deps/scripts), `docs` (docs only), `test` (tests only)
- **Typical split for a feature:** (1) deps/config, (2) data layer / server code, (3) UI components, (4) wiring / integration — adjust as needed so each commit builds and makes sense alone.
- **Never commit:** `.env.local`, secrets, or generated files that aren't already tracked.
- Always include `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>` in the commit trailer.

---

## Working agreement
- Before saying a phase is done, run `npm run verify` and fix everything it reports.
- Keep changes scoped to the current phase. Don't build features from later phases early.
- Prefer small, readable files. No `any`. No dead code or commented-out code.
- UI: clean, minimal, responsive (usable on a phone width), and works in light and dark mode. Always show currency as SGD.
- Show empty, loading and error states for every page (e.g. "Sheet not reachable — run `npm run sheets:check`").
- When something needs the user to do something outside the code (Google Cloud, FatSecret dashboard, etc.), stop and say so clearly instead of working around it.
