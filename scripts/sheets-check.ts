import { google } from "googleapis";

const EXPECTED_TABS = [
  "Income",
  "Subscriptions",
  "Budget",
  "Goals",
  "Contributions",
  "Settings",
];

async function main() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const sheetId = process.env.GOOGLE_SHEET_ID;

  if (!email || !privateKey || !sheetId) {
    console.error(
      "Missing environment variables. Copy .env.example to .env.local and fill in the values."
    );
    process.exit(1);
  }

  const auth = new google.auth.JWT({
    email,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const sheets = google.sheets({ version: "v4", auth });

  let spreadsheet;
  try {
    const res = await sheets.spreadsheets.get({
      spreadsheetId: sheetId,
      fields: "properties.title,sheets.properties.title",
    });
    spreadsheet = res.data;
  } catch (err: unknown) {
    const e = err as { code?: number; message?: string };
    if (e.code === 403) {
      console.error(
        "403 Forbidden — the sheet is not shared with the service account email,\n" +
          "or it is shared as Viewer instead of Editor.\n" +
          "See GOOGLE_SETUP.md step 5."
      );
    } else if (e.code === 404) {
      console.error(
        "404 Not Found — wrong GOOGLE_SHEET_ID.\n" +
          "Copy only the part between /d/ and /edit in the sheet URL.\n" +
          "See GOOGLE_SETUP.md step 4."
      );
    } else {
      console.error("Error connecting to Google Sheets:", e.message ?? String(err));
    }
    process.exit(1);
  }

  console.log(`Spreadsheet: "${spreadsheet.properties?.title ?? "(unknown)"}"`);

  const existingTabs = new Set(
    (spreadsheet.sheets ?? []).map((s) => s.properties?.title ?? "")
  );

  let allOk = true;
  for (const tab of EXPECTED_TABS) {
    if (existingTabs.has(tab)) {
      console.log(`  ✓ ${tab}`);
    } else {
      console.log(`  ✗ ${tab} — MISSING (run \`npm run sheets:init\`)`);
      allOk = false;
    }
  }

  if (allOk) {
    console.log("\nOK");
  } else {
    console.log("\nSome tabs are missing. Run `npm run sheets:init` to create them.");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
