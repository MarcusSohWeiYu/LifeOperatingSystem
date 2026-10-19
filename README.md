# Money Planner

A personal finance planning app for one user, running entirely on your local machine.
It is **not** a transaction tracker — that lives elsewhere.
This app is for **planning**: where your income goes, what your subscriptions cost, and how much to save each month to hit your trips and purchases by a target date.

Data is stored in a **Google Sheet** you own. The app talks to it via a service account and the Sheets API v4.

---

## Features

| Page | What it does |
|---|---|
| **Dashboard** | Monthly summary: income, unallocated funds, top goals, upcoming renewals |
| **Subscriptions** | All recurring costs normalised to monthly; "renewing soon" alerts |
| **Income** | Income sources with frequencies (weekly → monthly equivalent) |
| **Budget** | Zero-based budget by category (needs / wants / savings) with an allocation strip |
| **Goals** | Trips and purchases with target amounts, dates, monthly saving required, and progress |
| **Planner** | What-if sandbox — adjust income, toggle subscriptions, add hypothetical goals; never saves |

---

## First-time setup

1. Clone/copy this project to your machine.
2. Install dependencies: `npm install`
3. Follow **[GOOGLE_SETUP.md](./GOOGLE_SETUP.md)** steps 1–6 to create a Google Cloud project, enable the Sheets API, create a service account, create the Google Sheet, and fill in `.env.local`.
4. Initialise the sheet: `npm run sheets:init`
5. *(Optional)* Seed sample data: `npm run sheets:seed`
6. Start the dev server: `npm run dev` → open [http://127.0.0.1:3000](http://127.0.0.1:3000)

---

## npm scripts

| Script | What it does |
|---|---|
| `npm run dev` | Start the Next.js dev server on http://127.0.0.1:3000 (Turbopack) |
| `npm run build` | Production build |
| `npm start` | Serve the production build on http://127.0.0.1:3000 |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run `tsc --noEmit` |
| `npm test` | Run Vitest unit tests |
| `npm run verify` | Run typecheck + lint + test + build (pre-deploy check) |
| `npm run sheets:check` | Connect to the sheet and print which tabs exist or are missing |
| `npm run sheets:init` | Create any missing tabs with correct headers; safe to run repeatedly |
| `npm run sheets:seed` | Add sample data (only if tabs are empty, or use `--force`) |

---

## Running in production

### Option A — Node directly

```sh
npm run build
npm start
```

The server listens on http://127.0.0.1:3000.

### Option B — Docker

Requires [Docker Desktop](https://www.docker.com/products/docker-desktop/).

```sh
docker compose up -d
```

This builds the image and starts the container, publishing **only to 127.0.0.1:3000**.
Credentials are read from `.env.local` via `env_file` and are never copied into the image.

To stop:

```sh
docker compose down
```

To rebuild after a code change:

```sh
docker compose up -d --build
```

The container restarts automatically when Docker Desktop restarts (`restart: unless-stopped`).

---

## Installing as an app (PWA)

The app ships a web manifest. In Chrome or Edge, open http://127.0.0.1:3000 and click the install icon in the address bar ("Install Money Planner"). In Safari on macOS, use **File → Add to Dock**.

---

## Backing up your data

Your data lives in the Google Sheet, not on your local machine.

1. Open the sheet in Google Sheets.
2. **File → Download → Microsoft Excel (.xlsx)** — downloads all tabs in one file.

Google Sheets also keeps a full revision history (**File → Version history → See version history**).

---

## Security

This app has **no authentication**. Anyone who can reach http://127.0.0.1:3000 can read and modify your financial data.

- Keep the server bound to `127.0.0.1` (localhost). Do **not** change the bind address to `0.0.0.0` or expose the port on a public interface.
- Do not use a tunnel (ngrok, Cloudflare Tunnel, etc.) to expose it publicly.
- The service account private key lives in `.env.local`, which is git-ignored. Never commit it.

---

## Tech stack

- [Next.js](https://nextjs.org/) (App Router, standalone output) + TypeScript strict
- [Tailwind CSS v4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) (base-ui)
- [Google Sheets API v4](https://developers.google.com/sheets/api) via `googleapis`
- [Zod](https://zod.dev/) · [react-hook-form](https://react-hook-form.com/) · [Recharts](https://recharts.org/) · [date-fns](https://date-fns.org/)
- [Vitest](https://vitest.dev/) for unit tests (78 tests across finance functions)
