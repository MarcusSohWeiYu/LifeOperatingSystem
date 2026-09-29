# Google Sheets setup (do this yourself — ~10 minutes)

Claude Code can't click through Google Cloud for you. Do these steps once, **before Phase 2**.

> **Use your personal Gmail, not your work Google account.** Many company Google Workspace
> organisations block creating service-account keys by policy
> (`iam.disableServiceAccountKeyCreation`), and it's your personal finances anyway.

## 1. Create a Google Cloud project
1. Go to <https://console.cloud.google.com/> and sign in with your personal Gmail.
2. Click the project picker (top bar) → **New Project** → name it `money-planner` → **Create**.
3. Make sure `money-planner` is selected in the project picker.

## 2. Turn on the Google Sheets API
1. Go to **APIs & Services → Library**.
2. Search **Google Sheets API** → open it → **Enable**.

## 3. Create a service account and key
1. Go to **IAM & Admin → Service Accounts** → **Create service account**.
2. Name: `money-planner-app` → **Create and continue**.
3. Skip "Grant this service account access to project" (no roles needed) → **Done**.
4. Click the new service account → **Keys** tab → **Add key → Create new key → JSON** → **Create**.
5. A `.json` file downloads. Treat it like a password. **Don't put it inside the project folder.**

## 4. Create the Google Sheet
1. Go to <https://sheets.new> (same personal Gmail) and name it `Money Planner DB`.
2. Leave it empty. `npm run sheets:init` creates the tabs and headers for you.
3. Copy the **Sheet ID** from the URL:
   `https://docs.google.com/spreadsheets/d/`**`THIS_PART_IS_THE_ID`**`/edit`

## 5. Share the sheet with the service account
1. Open the JSON key file and copy the `client_email` value
   (looks like `money-planner-app@money-planner-xxxx.iam.gserviceaccount.com`).
2. In the sheet: **Share** → paste that email → role **Editor** → untick "Notify people" → **Share**.

## 6. Fill in `.env.local`
In the project root, copy `.env.example` to `.env.local` and fill it in from the JSON file:

```bash
GOOGLE_SERVICE_ACCOUNT_EMAIL=money-planner-app@money-planner-xxxx.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEET_ID=THIS_PART_IS_THE_ID
```

- Paste the `private_key` value **exactly as it appears in the JSON** (with the `\n` sequences), wrapped in double quotes.
- Fill this in yourself. Don't paste the key into the Claude Code chat.

## 7. Check it works
```bash
npm run sheets:check   # should print the sheet title and "OK"
npm run sheets:init    # creates the 6 tabs with headers
npm run sheets:seed    # optional: adds sample data
```

## Troubleshooting
| Error | Fix |
|---|---|
| `403 The caller does not have permission` | The sheet isn't shared with the service account email, or it's shared as Viewer instead of Editor. |
| `404 Requested entity was not found` | Wrong `GOOGLE_SHEET_ID`. Copy only the part between `/d/` and `/edit`. |
| `Google Sheets API has not been used in project…` | Step 2 was skipped, or it was done in a different project. |
| `error:1E08010C:DECODER routines::unsupported` / key errors | The private key is malformed. Re-copy it with the `\n`s and keep the double quotes. |
| "Key creation is disabled by an organization policy" | You're on a work/organisation account. Use a personal Gmail. |

## If a key ever leaks
Go to **IAM & Admin → Service Accounts → money-planner-app → Keys**, delete the key, create a new one and update `.env.local`.
