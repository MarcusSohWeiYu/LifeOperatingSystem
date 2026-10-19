import "server-only";
import { getSheetsClient, getSheetIds } from "@/lib/sheets/client";
import { env } from "@/lib/env";
import type { TabDef } from "@/lib/sheets/schema";

// ---- Helpers ----

/** Convert a 1-based column number to a letter (1→A, 11→K, 27→AA). */
function colLetter(n: number): string {
  let result = "";
  let remaining = n;
  while (remaining > 0) {
    const r = (remaining - 1) % 26;
    result = String.fromCharCode(65 + r) + result;
    remaining = Math.floor((remaining - 1) / 26);
  }
  return result;
}

/** Throw if the header row doesn't match the expected headers. */
export function validateHeaders(
  headerRow: unknown[],
  tabName: string,
  expected: readonly string[]
): void {
  const actual = headerRow.map((v) => (v == null ? "" : String(v)));
  const ok =
    actual.length === expected.length &&
    expected.every((h, i) => h === actual[i]);

  if (!ok) {
    throw new Error(
      `Tab "${tabName}" has unexpected headers.\n` +
        `  Expected: ${expected.join(", ")}\n` +
        `  Got:      ${actual.join(", ")}\n` +
        `Run \`npm run sheets:init\` to fix this.`
    );
  }
}

/**
 * Parse a raw values array (from Sheets API) into typed rows.
 * Skips invalid rows with a console.warn instead of throwing.
 */
export function parseTabData<TRow>(
  values: unknown[][] | null | undefined,
  def: Pick<TabDef<TRow, unknown>, "name" | "headers" | "parseRow">
): TRow[] {
  if (!values || values.length < 1) return [];

  const headerRow = values[0] ?? [];
  validateHeaders(headerRow, def.name, def.headers);

  const result: TRow[] = [];
  for (let i = 1; i < values.length; i++) {
    const cells = values[i];
    if (!cells) continue;
    try {
      result.push(def.parseRow(cells));
    } catch (err) {
      console.warn(
        `Tab "${def.name}" row ${i + 1}: invalid data, skipping — ${String(err)}`
      );
    }
  }
  return result;
}

/**
 * Find the VALUES-array index (0-based) of the row with the given id.
 * Index 0 = header row, 1 = first data row.
 * Returns null if not found.
 */
async function findRowIndex(
  tabName: string,
  id: string
): Promise<number | null> {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: env.GOOGLE_SHEET_ID,
    range: `'${tabName}'!A:A`,
    valueRenderOption: "UNFORMATTED_VALUE",
  });
  const values = res.data.values ?? [];
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    if (row?.[0] === id) return i;
  }
  return null;
}

// ---- Generic CRUD table ----

export function createTable<TRow extends { id: string }, TCreate>(
  def: TabDef<TRow, TCreate>
) {
  const range = `'${def.name}'!A:${colLetter(def.headers.length)}`;

  async function list(): Promise<TRow[]> {
    const sheets = getSheetsClient();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: env.GOOGLE_SHEET_ID,
      range,
      valueRenderOption: "UNFORMATTED_VALUE",
    });
    return parseTabData(res.data.values as unknown[][], def);
  }

  async function get(id: string): Promise<TRow | null> {
    const rows = await list();
    return rows.find((r) => r.id === id) ?? null;
  }

  async function create(input: TCreate): Promise<TRow> {
    const row = def.createRow(input);
    const cells = def.serializeRow(row);
    const sheets = getSheetsClient();
    await sheets.spreadsheets.values.append({
      spreadsheetId: env.GOOGLE_SHEET_ID,
      range: `'${def.name}'!A1`,
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: [cells] },
    });
    return row;
  }

  async function update(id: string, patch: Partial<TRow>): Promise<TRow> {
    const existing = await get(id);
    if (!existing) {
      throw new Error(`Tab "${def.name}": row "${id}" not found`);
    }

    const now = new Date().toISOString();
    const merged = Object.assign({}, existing, patch, { id: existing.id });
    // Restore createdAt; bump updatedAt if it exists on this row type
    if ("createdAt" in existing) {
      (merged as Record<string, unknown>).createdAt = (
        existing as Record<string, unknown>
      ).createdAt;
    }
    if ("updatedAt" in existing) {
      (merged as Record<string, unknown>).updatedAt = now;
    }
    const updated = merged as TRow;

    // Re-read row index fresh — never trust cached row numbers
    const valIdx = await findRowIndex(def.name, id);
    if (valIdx == null) {
      throw new Error(`Tab "${def.name}": cannot locate row "${id}" for update`);
    }
    const sheetRow = valIdx + 1; // values index → 1-based sheet row

    const sheets = getSheetsClient();
    await sheets.spreadsheets.values.update({
      spreadsheetId: env.GOOGLE_SHEET_ID,
      range: `'${def.name}'!A${sheetRow}:${colLetter(def.headers.length)}${sheetRow}`,
      valueInputOption: "RAW",
      requestBody: { values: [def.serializeRow(updated)] },
    });

    return updated;
  }

  async function remove(id: string): Promise<void> {
    // Find row index fresh
    const valIdx = await findRowIndex(def.name, id);
    if (valIdx == null) {
      throw new Error(`Tab "${def.name}": row "${id}" not found for deletion`);
    }

    const sheetIds = await getSheetIds();
    const sheetId = sheetIds[def.name];
    if (sheetId == null) {
      throw new Error(`Tab "${def.name}" not found in spreadsheet`);
    }

    const sheets = getSheetsClient();
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: env.GOOGLE_SHEET_ID,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId,
                dimension: "ROWS",
                startIndex: valIdx, // 0-based
                endIndex: valIdx + 1,
              },
            },
          },
        ],
      },
    });
  }

  return { list, get, create, update, remove };
}

// ---- Settings helper ----
// Settings is a key-value tab (key, value) with no id or timestamps.

export function createSettingsHelper() {
  async function getAll(): Promise<Record<string, string>> {
    const sheets = getSheetsClient();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: env.GOOGLE_SHEET_ID,
      range: "'Settings'!A:B",
      valueRenderOption: "UNFORMATTED_VALUE",
    });
    const values = res.data.values ?? [];
    const out: Record<string, string> = {};
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      if (!row) continue;
      const k = row[0];
      const v = row[1];
      if (k != null && k !== "") {
        out[String(k)] = v != null ? String(v) : "";
      }
    }
    return out;
  }

  async function getValue(key: string): Promise<string | null> {
    const all = await getAll();
    return all[key] ?? null;
  }

  async function setValue(key: string, value: string): Promise<void> {
    // Find existing key row
    const sheets = getSheetsClient();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: env.GOOGLE_SHEET_ID,
      range: "'Settings'!A:A",
      valueRenderOption: "UNFORMATTED_VALUE",
    });
    const values = res.data.values ?? [];

    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      if (row?.[0] === key) {
        // Update existing row
        const sheetRow = i + 1;
        await sheets.spreadsheets.values.update({
          spreadsheetId: env.GOOGLE_SHEET_ID,
          range: `'Settings'!A${sheetRow}:B${sheetRow}`,
          valueInputOption: "RAW",
          requestBody: { values: [[key, value]] },
        });
        return;
      }
    }

    // Append new row
    await sheets.spreadsheets.values.append({
      spreadsheetId: env.GOOGLE_SHEET_ID,
      range: "'Settings'!A1",
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: [[key, value]] },
    });
  }

  return { getAll, getValue, setValue };
}
