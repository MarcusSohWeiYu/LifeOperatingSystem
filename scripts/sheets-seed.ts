import { google } from "googleapis";
import { randomUUID } from "crypto";

// ---- Dates relative to today: 2026-09-29 ----
// Japan trip: ~14 months away → 2027-12-01
// New laptop: ~8 months away → 2027-05-15
// Emergency fund: ~12 months away → 2027-09-30

const EXPECTED_TABS = [
  "Income",
  "Subscriptions",
  "Budget",
  "Goals",
  "Contributions",
  "Settings",
];

const FORCE = process.argv.includes("--force");

function now() {
  return new Date().toISOString();
}

function row(...cells: (string | number | boolean)[]) {
  return cells;
}

async function main() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const sheetId = process.env.GOOGLE_SHEET_ID;

  if (!email || !privateKey || !sheetId) {
    console.error(
      "Missing environment variables. Copy .env.example to .env.local."
    );
    process.exit(1);
  }

  const auth = new google.auth.JWT({
    email,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const sheets = google.sheets({ version: "v4", auth });

  // Check that all tabs exist and have headers only (2 rows at most — header + maybe one row)
  for (const tab of EXPECTED_TABS) {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `'${tab}'!A:A`,
      valueRenderOption: "UNFORMATTED_VALUE",
    });
    const values = res.data.values ?? [];
    const dataRowCount = Math.max(0, values.length - 1); // subtract header
    if (dataRowCount > 0 && !FORCE) {
      console.error(
        `Tab "${tab}" already has ${dataRowCount} data row(s).\n` +
          "Re-run with --force to overwrite."
      );
      process.exit(1);
    }
  }

  const createdNow = now();

  // ---- Income ----
  const salaryId = randomUUID();
  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: "'Income'!A1",
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values: [
        row(
          salaryId,
          "Salary",
          6000,
          "monthly",
          "TRUE",
          "Primary income",
          createdNow,
          createdNow
        ),
      ],
    },
  });
  console.log("✓ Income");

  // ---- Subscriptions ----
  const subs = [
    row(randomUUID(), "Spotify", 15.98, "monthly", "Entertainment", "2026-10-15", "DBS Debit", "TRUE", "", createdNow, createdNow),
    row(randomUUID(), "Netflix", 19.98, "monthly", "Entertainment", "2026-10-22", "DBS Credit", "TRUE", "Standard plan", createdNow, createdNow),
    row(randomUUID(), "iCloud 200GB", 3.98, "monthly", "Utilities", "2026-10-01", "Apple Pay", "TRUE", "", createdNow, createdNow),
    row(randomUUID(), "Fitness First", 88.0, "monthly", "Health", "2026-10-10", "DBS Credit", "TRUE", "Basic membership", createdNow, createdNow),
    row(randomUUID(), "ChatGPT Plus", 28.0, "monthly", "Productivity", "2026-10-05", "DBS Credit", "TRUE", "", createdNow, createdNow),
    row(randomUUID(), "Domain renewal", 25.0, "yearly", "Utilities", "2027-03-01", "DBS Credit", "TRUE", "example.com", createdNow, createdNow),
  ];
  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: "'Subscriptions'!A1",
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: subs },
  });
  console.log("✓ Subscriptions");

  // ---- Budget ----
  const budgetRows = [
    row(randomUUID(), "Housing", 1800, "needs", "Rent", createdNow, createdNow, ""),
    row(randomUUID(), "Food & Groceries", 600, "needs", "", createdNow, createdNow, ""),
    row(randomUUID(), "Transport", 200, "needs", "MRT + occasional Grab", createdNow, createdNow, ""),
    row(randomUUID(), "Entertainment", 150, "wants", "", createdNow, createdNow, ""),
    row(randomUUID(), "Shopping", 200, "wants", "Clothes, household", createdNow, createdNow, ""),
    row(randomUUID(), "Emergency Fund Top-up", 300, "savings", "", createdNow, createdNow, ""),
  ];
  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: "'Budget'!A1",
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: budgetRows },
  });
  console.log("✓ Budget");

  // ---- Goals ----
  const japanId = randomUUID();
  const laptopId = randomUUID();
  const emergencyId = randomUUID();

  const goalsRows = [
    row(japanId, "Japan Trip", "trip", 4000, "2027-12-01", 1, "active", "Cherry blossom season", createdNow, createdNow),
    row(laptopId, "New Laptop", "purchase", 2500, "2027-05-15", 2, "active", "MacBook Pro replacement", createdNow, createdNow),
    row(emergencyId, "Emergency Fund", "other", 10000, "2027-09-30", 3, "active", "6 months of expenses", createdNow, createdNow),
  ];
  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: "'Goals'!A1",
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: goalsRows },
  });
  console.log("✓ Goals");

  // ---- Contributions ----
  const contribs: ReturnType<typeof row>[] = [
    // Japan trip contributions (past dates)
    row(randomUUID(), japanId, 200, "2026-04-30", "April savings", createdNow),
    row(randomUUID(), japanId, 200, "2026-05-31", "May savings", createdNow),
    row(randomUUID(), japanId, 250, "2026-06-30", "June savings", createdNow),
    row(randomUUID(), japanId, 200, "2026-07-31", "July savings", createdNow),
    row(randomUUID(), japanId, 200, "2026-08-31", "August savings", createdNow),
    // Laptop contributions
    row(randomUUID(), laptopId, 300, "2026-07-31", "July", createdNow),
    row(randomUUID(), laptopId, 300, "2026-08-31", "August", createdNow),
    row(randomUUID(), laptopId, 300, "2026-09-28", "September", createdNow),
    // Emergency fund contributions
    row(randomUUID(), emergencyId, 500, "2026-05-31", "Start of fund", createdNow),
    row(randomUUID(), emergencyId, 500, "2026-06-30", "", createdNow),
    row(randomUUID(), emergencyId, 500, "2026-07-31", "", createdNow),
    row(randomUUID(), emergencyId, 500, "2026-08-31", "", createdNow),
    row(randomUUID(), emergencyId, 300, "2026-09-28", "", createdNow),
  ];
  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: "'Contributions'!A1",
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: contribs },
  });
  console.log("✓ Contributions");

  console.log("\nSeed complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
