# actions/

Server Actions — one file per entity (subscriptions, income, budget, goals, contributions).

Each action validates input with zod, calls the repo, revalidates the affected sheet tab cache tag, and returns `{ ok: boolean; error?: string }`.
