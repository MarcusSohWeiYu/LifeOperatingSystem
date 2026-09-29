# lib/sheets/

Google Sheets integration — server-only.

- `client.ts` — singleton authenticated Sheets client (JWT service account)
- `schema.ts` — tab definitions: headers, zod row schemas, TypeScript types
- `table.ts` — generic CRUD: list, get, create, update, remove; header validation on first read
