import "server-only";
import { google } from "googleapis";
import { env } from "@/lib/env";

// ---- Singleton Sheets client ----

let _client: ReturnType<typeof google.sheets> | null = null;

export function getSheetsClient() {
  if (_client) return _client;

  const auth = new google.auth.JWT({
    email: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: env.GOOGLE_PRIVATE_KEY,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  _client = google.sheets({ version: "v4", auth });
  return _client;
}

// ---- Tab name → numeric sheetId cache ----
// Needed for batchUpdate deleteDimension requests.

let _sheetIdCache: Record<string, number> | null = null;

export async function getSheetIds(): Promise<Record<string, number>> {
  if (_sheetIdCache) return _sheetIdCache;

  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.get({
    spreadsheetId: env.GOOGLE_SHEET_ID,
    fields: "sheets.properties(title,sheetId)",
  });

  const map: Record<string, number> = {};
  for (const sheet of res.data.sheets ?? []) {
    const title = sheet.properties?.title;
    const sheetId = sheet.properties?.sheetId;
    if (title != null && sheetId != null) {
      map[title] = sheetId;
    }
  }

  _sheetIdCache = map;
  return map;
}

export function clearSheetIdCache() {
  _sheetIdCache = null;
}
