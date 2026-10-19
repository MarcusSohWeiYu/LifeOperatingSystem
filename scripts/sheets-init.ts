import { google } from "googleapis";

const TABS = {
  Income: [
    "id",
    "name",
    "amount",
    "frequency",
    "active",
    "notes",
    "createdAt",
    "updatedAt",
  ],
  Subscriptions: [
    "id",
    "name",
    "amount",
    "frequency",
    "category",
    "nextRenewal",
    "paymentMethod",
    "active",
    "notes",
    "createdAt",
    "updatedAt",
  ],
  Budget: [
    "id",
    "category",
    "plannedMonthly",
    "type",
    "notes",
    "createdAt",
    "updatedAt",
    "goalId",
  ],
  Goals: [
    "id",
    "name",
    "type",
    "targetAmount",
    "targetDate",
    "priority",
    "status",
    "notes",
    "createdAt",
    "updatedAt",
  ],
  Contributions: ["id", "goalId", "amount", "date", "note", "createdAt"],
  Settings: ["key", "value"],
} as const;

const DEFAULT_SETTINGS: [string, string][] = [
  ["currency", "SGD"],
  ["renewalAlertDays", "7"],
];

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

  // Fetch current sheet state
  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId: sheetId,
    fields: "sheets.properties(title,sheetId,index)",
  });

  const existingSheets = spreadsheet.data.sheets ?? [];
  const existingByTitle = new Map(
    existingSheets.map((s) => [
      s.properties?.title ?? "",
      {
        sheetId: s.properties?.sheetId ?? 0,
        index: s.properties?.index ?? 0,
      },
    ])
  );

  const requests: object[] = [];

  // 1. Create missing tabs
  for (const tabName of Object.keys(TABS)) {
    if (!existingByTitle.has(tabName)) {
      console.log(`  + Creating tab: ${tabName}`);
      requests.push({
        addSheet: {
          properties: { title: tabName },
        },
      });
    }
  }

  if (requests.length > 0) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: sheetId,
      requestBody: { requests },
    });
    // Re-fetch to get the new sheetIds
    const updated = await sheets.spreadsheets.get({
      spreadsheetId: sheetId,
      fields: "sheets.properties(title,sheetId,index)",
    });
    (updated.data.sheets ?? []).forEach((s) => {
      const title = s.properties?.title ?? "";
      existingByTitle.set(title, {
        sheetId: s.properties?.sheetId ?? 0,
        index: s.properties?.index ?? 0,
      });
    });
  }

  // 2. Write headers, freeze row 1, bold row 1 for each expected tab
  for (const [tabName, headers] of Object.entries(TABS)) {
    const sheetMeta = existingByTitle.get(tabName);
    if (!sheetMeta) {
      console.error(`  ! Could not find sheetId for "${tabName}" — skipping`);
      continue;
    }
    const numericSheetId = sheetMeta.sheetId;

    // Read existing row 1
    const existing = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `'${tabName}'!1:1`,
      valueRenderOption: "FORMATTED_VALUE",
    });
    const currentHeaders = (existing.data.values?.[0] ?? []).map(String);

    if (currentHeaders.length > 0) {
      // Tab already has row 1 — check it matches or can be migrated
      const exactMatch =
        currentHeaders.length === headers.length &&
        headers.every((h, i) => h === currentHeaders[i]);

      if (exactMatch) {
        console.log(`  ✓ ${tabName}: headers OK`);
      } else {
        // Check if existing headers are a valid prefix of expected headers
        // (migration: new columns appended at the end)
        const isPrefix =
          currentHeaders.length < headers.length &&
          currentHeaders.every((h, i) => h === headers[i]);

        if (isPrefix) {
          const missing = headers.slice(currentHeaders.length);
          const newRow = [...currentHeaders, ...missing];
          console.log(
            `  → ${tabName}: appending missing headers: ${missing.join(", ")}`
          );
          await sheets.spreadsheets.values.update({
            spreadsheetId: sheetId,
            range: `'${tabName}'!A1`,
            valueInputOption: "RAW",
            requestBody: { values: [newRow] },
          });
        } else {
          console.error(
            `  ! Tab "${tabName}" already has DIFFERENT headers — not overwriting.\n` +
              `    Expected: ${headers.join(", ")}\n` +
              `    Got:      ${currentHeaders.join(", ")}\n` +
              `    Resolve this manually or delete the tab and re-run.`
          );
          process.exit(1);
        }
      }
    } else {
      // Tab is empty — write headers
      console.log(`  → ${tabName}: writing headers`);
      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: `'${tabName}'!A1`,
        valueInputOption: "RAW",
        requestBody: { values: [[...headers]] },
      });
    }

    // Freeze row 1 + bold row 1
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: sheetId,
      requestBody: {
        requests: [
          {
            updateSheetProperties: {
              properties: {
                sheetId: numericSheetId,
                gridProperties: { frozenRowCount: 1 },
              },
              fields: "gridProperties.frozenRowCount",
            },
          },
          {
            repeatCell: {
              range: {
                sheetId: numericSheetId,
                startRowIndex: 0,
                endRowIndex: 1,
              },
              cell: {
                userEnteredFormat: { textFormat: { bold: true } },
              },
              fields: "userEnteredFormat.textFormat.bold",
            },
          },
        ],
      },
    });
  }

  // 3. Set default Settings values (only if key is missing)
  const settingsRes = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: "'Settings'!A:B",
    valueRenderOption: "UNFORMATTED_VALUE",
  });
  const settingsRows = settingsRes.data.values ?? [];
  const existingKeys = new Set(
    settingsRows.slice(1).map((r) => (r[0] != null ? String(r[0]) : ""))
  );

  for (const [key, value] of DEFAULT_SETTINGS) {
    if (!existingKeys.has(key)) {
      console.log(`  → Settings: setting default ${key}=${value}`);
      await sheets.spreadsheets.values.append({
        spreadsheetId: sheetId,
        range: "'Settings'!A1",
        valueInputOption: "RAW",
        insertDataOption: "INSERT_ROWS",
        requestBody: { values: [[key, value]] },
      });
    }
  }

  // 4. Delete "Sheet1" if it exists and is empty
  const sheet1 = existingByTitle.get("Sheet1");
  if (sheet1) {
    const s1Data = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "Sheet1!A:A",
      valueRenderOption: "UNFORMATTED_VALUE",
    });
    const s1Values = s1Data.data.values ?? [];
    if (s1Values.length === 0) {
      console.log("  → Deleting empty Sheet1");
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: sheetId,
        requestBody: {
          requests: [
            {
              deleteSheet: { sheetId: sheet1.sheetId },
            },
          ],
        },
      });
    } else {
      console.log("  ⚠ Sheet1 has data — leaving it in place");
    }
  }

  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
