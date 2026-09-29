# Build plan: prompts to paste into Claude Code

## How to use this
1. Create an empty folder, e.g. `~/Projects/money-planner`, and put **`CLAUDE.md`** in it.
   Keep `GOOGLE_SETUP.md` and this file handy (in the folder is fine).
2. Run `git init` in the folder, then open Claude Code there.
3. Paste **one phase at a time**. For each phase:
   - Start it in **plan mode** (Shift+Tab) and check the plan before accepting.
   - When it finishes, check the "Done when" list yourself, then commit: `git add -A && git commit -m "Phase N: ..."`.
   - Run `/clear` before the next phase. `CLAUDE.md` is reloaded automatically, so no context is lost.
4. Do **`GOOGLE_SETUP.md`** between Phase 1 and Phase 2.

| Phase | What you get |
|---|---|
| 1 | Next.js project, tooling, layout and nav, placeholder pages |
| 2 | Google Sheets data layer + check/init/seed scripts |
| 3 | Finance calculations with unit tests |
| 4 | Subscriptions page (full CRUD) |
| 5 | Income + Budget pages |
| 6 | Goals + contributions |
| 7 | Dashboard |
| 8 | What-if Planner |
| 9 | Polish, local production run, README |

---

## Phase 1 — Scaffold

```
Read CLAUDE.md fully before doing anything. This is Phase 1: scaffold the project. Don't touch Google Sheets yet.

1. Create a Next.js app in the CURRENT directory (not a subfolder) with TypeScript, Tailwind, ESLint, App Router, src/ dir, import alias "@/*", npm.
2. Turn on TypeScript strict mode, plus noUncheckedIndexedAccess.
3. Install and initialise shadcn/ui. Add these components: button, card, table, dialog, form, input, label, select, badge, progress, separator, sonner (toasts), dropdown-menu, alert, skeleton, switch, textarea, tabs.
4. Install the rest of the stack from CLAUDE.md: googleapis, zod, react-hook-form, @hookform/resolvers, date-fns, recharts, lucide-react, server-only. Dev dependencies: vitest, tsx.
5. Add all npm scripts listed in CLAUDE.md. dev and start must bind to 127.0.0.1. The sheets:* scripts should point to files in scripts/ run via tsx with dotenv-style loading of .env.local (use Node's --env-file=.env.local flag rather than adding a dependency). For now, make them print "not implemented".
6. Create src/lib/env.ts: a zod-validated server-only env reader for the three GOOGLE_* variables. It fixes the \n newlines in the private key and gives a clear error naming whichever variable is missing. Don't call it anywhere yet.
7. Create .env.example (empty values) and make sure .gitignore covers .env*.local and *.json key files (keep package.json, tsconfig.json and the other config JSONs tracked).
8. Build the app shell: a sidebar on desktop and a bottom/tab nav on mobile, with links to Dashboard (/), Subscriptions, Income, Budget, Goals, Planner. Add a light/dark theme toggle (next-themes is allowed). Each route is a placeholder page with a title and a one-line description of what it will do.
9. Create the empty folder structure from CLAUDE.md, adding a short README.md in any folder that's still empty.

Done when: `npm run verify` passes, `npm run dev` serves on http://127.0.0.1:3000, every nav link works and the layout looks right at phone width. Show me the final file tree.
```

➡️ **Now do everything in `GOOGLE_SETUP.md`, up to and including step 6.**

---

## Phase 2 — Google Sheets data layer

```
Read CLAUDE.md. This is Phase 2: the Google Sheets data layer. I have already created .env.local with real credentials — do not open, print or modify it.

1. src/lib/sheets/schema.ts: one definition per tab (name, ordered headers, zod row schema, zod "create input" schema) exactly matching the schema table in CLAUDE.md. Export inferred TypeScript types. Parse numbers and booleans from the sheet robustly (API returns numbers, strings, or missing cells).
2. src/lib/sheets/client.ts: a singleton authenticated Sheets client (JWT service account, spreadsheets scope) using src/lib/env.ts. Also a helper that fetches and caches the tab name → numeric sheetId map (needed for row deletes).
3. src/lib/sheets/table.ts: a generic createTable(def) that returns:
   - list(): all rows parsed and validated. Invalid rows are skipped with a console.warn saying the tab and row number, so one bad row doesn't crash the app.
   - get(id)
   - create(input): generates the UUID and createdAt/updatedAt, appends with valueInputOption RAW
   - update(id, patch): re-reads to find the row index by id, writes the full row, bumps updatedAt
   - remove(id): finds the row index by id, deletes it with batchUpdate deleteDimension
   - header validation on first read, with the error message from CLAUDE.md
   Settings is a key/value tab, so give it a small dedicated get/set helper instead of the id-based table.
4. src/lib/repos/*.ts: one repo per tab built on createTable, plus:
   - a batch loader loadAll() that reads every tab in ONE values.batchGet call (the dashboard will use it)
   - contributions.listByGoal(goalId)
   - settings with defaults (currency SGD, renewalAlertDays 7) when a key is missing
   Wrap reads in Next tag-based caching (tag per tab, e.g. "sheet:Goals") and export a revalidateTab(tab) helper for server actions.
5. Scripts:
   - scripts/sheets-check.ts: connects, prints the spreadsheet title and which expected tabs exist or are missing, then "OK". Never prints credentials. Prints friendly hints for 403/404 errors (see GOOGLE_SETUP.md troubleshooting).
   - scripts/sheets-init.ts: IDEMPOTENT. Creates any missing tabs, writes header rows to empty tabs, freezes and bolds row 1, and sets default Settings. If a tab already has a DIFFERENT header row, stop and report it — don't overwrite it. Deletes the default "Sheet1" only if it's empty.
   - scripts/sheets-seed.ts: adds realistic SGD sample data ONLY if the tabs are empty (refuses otherwise unless run with --force). Sample: 1 salary income; ~6 subscriptions of mixed frequencies (e.g. Spotify, Netflix, iCloud, a gym, an AI tool, a yearly domain renewal); ~6 budget categories across needs/wants/savings; 3 goals (a Japan trip in about 14 months, a new laptop in about 8 months, an emergency fund in about 12 months) with a few contributions each.
6. Temporarily render the row counts per tab on the Dashboard placeholder so I can confirm the connection end to end.

Stop after writing the code and tell me to run, in order: npm run sheets:check, npm run sheets:init, npm run sheets:seed. Wait for me to paste the output before fixing anything.

Done when: all three scripts succeed against my real sheet, the dashboard shows row counts, and `npm run verify` passes.
```

---

## Phase 3 — Finance logic + tests

```
Read CLAUDE.md, especially "Finance rules". This is Phase 3: pure calculation functions with tests. No UI changes.

Create in src/lib/finance/ (pure TypeScript, no I/O, no imports from lib/sheets; pass "today" in as a parameter everywhere, never call new Date() inside):
- money.ts: toCents, fromCents, addCents, formatSGD (en-SG, SGD)
- frequency.ts: toMonthlyCents(amount, frequency)
- renewals.ts: nextRenewalDate(storedDate, frequency, today) and isRenewingSoon(date, today, alertDays)
- goals.ts: savedCents(contributions), monthsRemaining(targetDate, today), requiredMonthlyCents(goal, saved, today), contributedThisMonthCents(contributions, today), goalHealth(...) returning reached | overdue | on-track | behind, and a progress percentage (0–100, clamped)
- allocation.ts: buildAllocation({ income, subscriptions, budget, goals, contributions, today }) returning total monthly income, subscriptions total, budget total by type (needs/wants/savings), goals total, unallocated, isOverAllocated, and a per-goal priority funding plan (fully / partly / unfunded) following the rules in CLAUDE.md. Ignore inactive income/subscriptions and non-active goals.

Write thorough Vitest tests for every function, including edge cases: target date this month; target date in the past; already-reached goal; overshoot (saved > target); yearly and weekly subscriptions; a renewal date far in the past that needs rolling forward several cycles; month-end dates (Jan 31 + 1 month); rounding (required monthly rounds UP to the cent); over-allocation with priority ties broken by earliest target date; empty inputs.

Done when: `npm test` shows all tests passing, `npm run verify` passes, and you give me a short table of each function and what it returns for one example.
```

---

## Phase 4 — Subscriptions page

```
Read CLAUDE.md. This is Phase 4: the /subscriptions page with full CRUD.

- Server Component page that reads via the subscriptions repo and uses the finance functions.
- Summary cards at the top: total per month, total per year, number active, and how many renew within renewalAlertDays.
- Table (cards on mobile): name, category, amount + frequency, monthly equivalent, next renewal (rolled forward), a "Renewing soon" badge, payment method, and an active toggle. Sort by next renewal by default; allow sorting by monthly cost. Inactive rows are greyed out and listed last.
- "Add subscription" and "Edit" open a dialog form (react-hook-form + zod, the same schema as the repo input). Delete asks for confirmation in a dialog. Never use window.confirm.
- Server Actions in src/actions/subscriptions.ts: create, update, toggleActive, remove. Each validates with zod, calls the repo, revalidates the tab and returns { ok, error }. Show a toast on success or failure.
- Category is free text with suggestions from existing categories.
- Empty state with an "Add your first subscription" button. Loading state uses skeletons (loading.tsx). An error boundary (error.tsx) with a friendly message pointing to `npm run sheets:check`.

Done when: I can add, edit, toggle and delete a subscription, the change shows up in the Google Sheet within a few seconds, totals update, it works at phone width, and `npm run verify` passes.
```

---

## Phase 5 — Income + Budget

```
Read CLAUDE.md. This is Phase 5: the /income and /budget pages. Follow the same patterns as /subscriptions (dialog forms, server actions, toasts, empty/loading/error states). Reuse components instead of duplicating them.

/income
- List income sources with amount, frequency, monthly equivalent and active toggle. Show total monthly income at the top.

/budget
- List categories grouped by type (needs / wants / savings) with planned monthly amounts and subtotals.
- At the top, an "allocation strip" using buildAllocation: Income → Subscriptions → Budget (needs/wants/savings) → Goals → Unallocated. Show each as an amount and a % of income in one horizontal stacked bar.
- Unallocated shows green at exactly $0 ("every dollar has a job"), neutral when positive ("$X left to assign"), and red when negative ("over-allocated by $X").
- Also show a needs/wants/savings % split beside a 50/30/20 reference. Keep it informational, not judgemental.

Done when: CRUD works on both pages, the allocation strip matches the numbers from buildAllocation, and `npm run verify` passes.
```

---

## Phase 6 — Goals + contributions

```
Read CLAUDE.md. This is Phase 6: /goals and /goals/[id].

/goals
- Tabs or filter: Active / Completed / Cancelled, plus a Trip / Purchase / Other filter.
- A card per goal: name, type icon, target amount, target date, months left, saved so far, progress bar, "Save $X / month" (requiredMonthly), and a health badge (reached / on-track / behind / overdue).
- Sort by priority, then target date. Allow changing priority with up/down controls that write to the sheet.
- "Add goal" dialog (name, type, target amount, target date, priority, notes). As the user types, show a live preview of the required monthly saving from the form values, using the Phase 3 functions on the client (they're pure, so importing them in a client component is fine).
- "Add contribution" quick action on each card (amount, date defaulting to today, note).
- When saved ≥ target, offer "Mark as completed". Don't mark it automatically.

/goals/[id]
- Goal details, edit and delete (deleting a goal also deletes its contributions — confirm first and say how many contributions will be removed).
- Contributions list (edit/delete each).
- A small chart of cumulative saved amount over time against a straight "ideal pace" line from the first contribution to the target by the target date (recharts).

Done when: the full goal lifecycle works (create → contribute → complete) and is reflected in the sheet, and `npm run verify` passes.
```

---

## Phase 7 — Dashboard

```
Read CLAUDE.md. This is Phase 7: the dashboard at /. Remove the temporary row counts from Phase 2.

Load everything with the single batch loader (one Sheets API call), then compute with buildAllocation.

Layout (top to bottom, responsive):
1. Headline: "This month's plan": monthly income, unallocated (coloured as on /budget), and a one-line status such as "You're over-allocated by $120 — the Laptop goal is only partly funded."
2. The allocation strip (reuse the component from /budget).
3. Two columns on desktop, stacked on mobile:
   - Goals: the top 3 active goals by priority with progress, "save $X/mo" and health badge, plus a link to /goals. Show a warning row for any goal that is behind or overdue.
   - Subscriptions: monthly total, the next 5 renewals (with "renewing soon" highlighted), and a link to /subscriptions.
4. Priority funding plan (only shown when over-allocated): which goals are fully, partly or unfunded, and how much each is short.
5. "Coming up" timeline for the next 90 days: subscription renewals and goal target dates, merged and sorted by date.

Use the same card, badge and number formatting as the other pages. Numbers must line up (tabular figures). Charts need readable labels in both light and dark mode.

Done when: the dashboard loads with ONE Sheets API call (log it in dev to prove it), everything matches the individual pages, and `npm run verify` passes.
```

---

## Phase 8 — What-if Planner

```
Read CLAUDE.md. This is Phase 8: /planner, a sandbox that NEVER writes to the sheet.

- Load real data server-side, then pass it to a client component as the starting scenario.
- Controls: adjust monthly income (slider plus input), toggle individual subscriptions off, change budget category amounts, add/remove hypothetical goals, and change an existing goal's target date or amount.
- Recompute live with buildAllocation on every change, showing a before → after comparison: unallocated, each goal's required monthly amount, and the funding plan.
- A useful extra: "What date can I afford?" For a hypothetical goal, given a monthly amount I'm willing to save, show the earliest target date. Add this as a pure function in src/lib/finance/goals.ts with tests.
- A "Reset to my real numbers" button. Remember the scenario in localStorage (wrapped in try/catch) so a refresh doesn't lose it.
- Make it very clear on screen this is a sandbox ("Nothing here is saved to your sheet").

Done when: changing any control updates the numbers instantly, nothing is written to the sheet (confirm by checking the sheet), the new function has tests, and `npm run verify` passes.
```

---

## Phase 9 — Polish + run it locally for real

```
Read CLAUDE.md. This is Phase 9: polish and local production setup.

1. Review the whole app for consistency: spacing, number formatting, empty/loading/error states, keyboard access in dialogs, focus rings, and phone-width layout. Fix what you find and list the changes.
2. Add metadata, a favicon, and a web app manifest so I can install it as an app (Chrome "Install" / Safari "Add to Dock"). Name it "Money Planner" and give it a simple icon.
3. Add a Dockerfile (multi-stage, Next.js output: "standalone", non-root user) and docker-compose.yml that:
   - reads secrets from .env.local via env_file (never copies it into the image)
   - publishes the port ONLY on 127.0.0.1 ("127.0.0.1:3000:3000")
   - uses restart: unless-stopped
   Make sure .dockerignore excludes .env*, .git, node_modules and any *.json key files.
4. Write README.md covering: what the app does, first-time setup (link GOOGLE_SETUP.md), all npm scripts, running with `npm run build && npm start` or with Docker, how to back up the data (File → Download in Google Sheets), and a "Security" section explaining there's no auth, so it must stay on localhost.
5. Run `npm run verify` and `docker compose build`, then fix any issues.

Done when: `docker compose up -d` serves the app on http://127.0.0.1:3000 and survives a restart of Docker Desktop, the app can be installed from the browser, and the README is complete.
```

---

## Useful follow-up prompts
- **Bug:** `The <page> shows <X> but the sheet has <Y>. Find the cause, add a failing test first, then fix it.`
- **New field:** `Add a "<field>" column to the <Tab> tab. Update schema.ts, the init script (append the column, don't break existing data), repo, forms and any calculations. Tell me what to change in the sheet by hand, if anything.`
- **Review:** `Review the codebase against CLAUDE.md and list any rule violations, ranked by severity. Don't change anything yet.`
- **Later, to connect your existing tracker:** `Add a read-only "Actuals" data source: a second spreadsheet ID in env, read a tab of transactions, and show planned vs actual per budget category on /budget.`
