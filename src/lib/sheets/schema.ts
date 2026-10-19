import "server-only";
import { z } from "zod";
import { randomUUID } from "crypto";

// ---- Enums ----

export const FrequencySchema = z.enum([
  "weekly",
  "fortnightly",
  "monthly",
  "quarterly",
  "yearly",
]);
export type Frequency = z.infer<typeof FrequencySchema>;

export const BudgetTypeSchema = z.enum(["needs", "wants", "savings"]);
export type BudgetType = z.infer<typeof BudgetTypeSchema>;

export const GoalTypeSchema = z.enum(["trip", "purchase", "other"]);
export type GoalType = z.infer<typeof GoalTypeSchema>;

export const GoalStatusSchema = z.enum(["active", "completed", "cancelled"]);
export type GoalStatus = z.infer<typeof GoalStatusSchema>;

// ---- Cell parsing helpers ----
// The Sheets API with UNFORMATTED_VALUE returns: numbers as numbers, booleans
// as TRUE/FALSE strings, strings as strings, missing trailing cells as undefined.

function parseNum(v: unknown, field: string): number {
  if (typeof v === "number" && !isNaN(v)) return v;
  if (typeof v === "string" && v !== "") {
    const n = parseFloat(v);
    if (!isNaN(n)) return n;
  }
  throw new Error(`${field}: expected number, got ${String(v)}`);
}

function parseBool(v: unknown, field: string): boolean {
  if (v === true || v === "TRUE") return true;
  if (v === false || v === "FALSE") return false;
  throw new Error(`${field}: expected TRUE/FALSE, got ${String(v)}`);
}

function parseReqStr(v: unknown, field: string): string {
  if (v != null && v !== "") return String(v);
  throw new Error(`${field}: required`);
}

function parseOptStr(v: unknown): string {
  return v == null ? "" : String(v);
}

function parseIntField(v: unknown, field: string): number {
  const n = parseNum(v, field);
  return Math.round(n); // tolerate float storage artefacts
}

// ---- Tab definition type ----

export interface TabDef<TRow, TCreate> {
  name: string;
  headers: readonly string[];
  rowSchema: z.ZodType<TRow>;
  createSchema: z.ZodType<TCreate>;
  parseRow: (cells: unknown[]) => TRow;
  serializeRow: (row: TRow) => (string | number | boolean)[];
  createRow: (input: TCreate) => TRow;
}

// ============================================================
// Income
// ============================================================

export const IncomeRowSchema = z.object({
  id: z.string(),
  name: z.string(),
  amount: z.number(),
  frequency: FrequencySchema,
  active: z.boolean(),
  notes: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type IncomeRow = z.infer<typeof IncomeRowSchema>;

export const IncomeCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  amount: z.number().positive("Amount must be positive"),
  frequency: FrequencySchema,
  active: z.boolean().default(true),
  notes: z.string().default(""),
});
export type IncomeCreate = z.infer<typeof IncomeCreateSchema>;

export const incomeDef: TabDef<IncomeRow, IncomeCreate> = {
  name: "Income",
  headers: [
    "id",
    "name",
    "amount",
    "frequency",
    "active",
    "notes",
    "createdAt",
    "updatedAt",
  ],
  rowSchema: IncomeRowSchema,
  createSchema: IncomeCreateSchema,
  parseRow(cells) {
    return {
      id: parseReqStr(cells[0], "id"),
      name: parseReqStr(cells[1], "name"),
      amount: parseNum(cells[2], "amount"),
      frequency: FrequencySchema.parse(cells[3]),
      active: parseBool(cells[4], "active"),
      notes: parseOptStr(cells[5]),
      createdAt: parseReqStr(cells[6], "createdAt"),
      updatedAt: parseReqStr(cells[7], "updatedAt"),
    };
  },
  serializeRow(row) {
    return [
      row.id,
      row.name,
      row.amount,
      row.frequency,
      row.active ? "TRUE" : "FALSE",
      row.notes,
      row.createdAt,
      row.updatedAt,
    ];
  },
  createRow(input) {
    const now = new Date().toISOString();
    return {
      id: randomUUID(),
      name: input.name,
      amount: input.amount,
      frequency: input.frequency,
      active: input.active,
      notes: input.notes,
      createdAt: now,
      updatedAt: now,
    };
  },
};

// ============================================================
// Subscriptions
// ============================================================

export const SubscriptionRowSchema = z.object({
  id: z.string(),
  name: z.string(),
  amount: z.number(),
  frequency: FrequencySchema,
  category: z.string(),
  nextRenewal: z.string(),
  paymentMethod: z.string(),
  active: z.boolean(),
  notes: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type SubscriptionRow = z.infer<typeof SubscriptionRowSchema>;

export const SubscriptionCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  amount: z.number().positive("Amount must be positive"),
  frequency: FrequencySchema,
  category: z.string().default(""),
  nextRenewal: z.string().min(1, "Next renewal date is required"),
  paymentMethod: z.string().default(""),
  active: z.boolean().default(true),
  notes: z.string().default(""),
});
export type SubscriptionCreate = z.infer<typeof SubscriptionCreateSchema>;

export const subscriptionDef: TabDef<SubscriptionRow, SubscriptionCreate> = {
  name: "Subscriptions",
  headers: [
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
  rowSchema: SubscriptionRowSchema,
  createSchema: SubscriptionCreateSchema,
  parseRow(cells) {
    return {
      id: parseReqStr(cells[0], "id"),
      name: parseReqStr(cells[1], "name"),
      amount: parseNum(cells[2], "amount"),
      frequency: FrequencySchema.parse(cells[3]),
      category: parseOptStr(cells[4]),
      nextRenewal: parseReqStr(cells[5], "nextRenewal"),
      paymentMethod: parseOptStr(cells[6]),
      active: parseBool(cells[7], "active"),
      notes: parseOptStr(cells[8]),
      createdAt: parseReqStr(cells[9], "createdAt"),
      updatedAt: parseReqStr(cells[10], "updatedAt"),
    };
  },
  serializeRow(row) {
    return [
      row.id,
      row.name,
      row.amount,
      row.frequency,
      row.category,
      row.nextRenewal,
      row.paymentMethod,
      row.active ? "TRUE" : "FALSE",
      row.notes,
      row.createdAt,
      row.updatedAt,
    ];
  },
  createRow(input) {
    const now = new Date().toISOString();
    return {
      id: randomUUID(),
      name: input.name,
      amount: input.amount,
      frequency: input.frequency,
      category: input.category,
      nextRenewal: input.nextRenewal,
      paymentMethod: input.paymentMethod,
      active: input.active,
      notes: input.notes,
      createdAt: now,
      updatedAt: now,
    };
  },
};

// ============================================================
// Budget
// ============================================================

export const BudgetRowSchema = z.object({
  id: z.string(),
  category: z.string(),
  plannedMonthly: z.number(),
  type: BudgetTypeSchema,
  notes: z.string(),
  goalId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type BudgetRow = z.infer<typeof BudgetRowSchema>;

export const BudgetCreateSchema = z.object({
  category: z.string().min(1, "Category is required"),
  plannedMonthly: z.number().nonnegative("Amount must be ≥ 0"),
  type: BudgetTypeSchema,
  notes: z.string().default(""),
  goalId: z.string().optional(),
});
export type BudgetCreate = z.infer<typeof BudgetCreateSchema>;

export const budgetDef: TabDef<BudgetRow, BudgetCreate> = {
  name: "Budget",
  headers: [
    "id",
    "category",
    "plannedMonthly",
    "type",
    "notes",
    "createdAt",
    "updatedAt",
    "goalId",
  ],
  rowSchema: BudgetRowSchema,
  createSchema: BudgetCreateSchema,
  parseRow(cells) {
    return {
      id: parseReqStr(cells[0], "id"),
      category: parseReqStr(cells[1], "category"),
      plannedMonthly: parseNum(cells[2], "plannedMonthly"),
      type: BudgetTypeSchema.parse(cells[3]),
      notes: parseOptStr(cells[4]),
      createdAt: parseReqStr(cells[5], "createdAt"),
      updatedAt: parseReqStr(cells[6], "updatedAt"),
      goalId: parseOptStr(cells[7]),
    };
  },
  serializeRow(row) {
    return [
      row.id,
      row.category,
      row.plannedMonthly,
      row.type,
      row.notes,
      row.createdAt,
      row.updatedAt,
      row.goalId,
    ];
  },
  createRow(input) {
    const now = new Date().toISOString();
    return {
      id: randomUUID(),
      category: input.category,
      plannedMonthly: input.plannedMonthly,
      type: input.type,
      notes: input.notes,
      createdAt: now,
      updatedAt: now,
      goalId: input.goalId ?? "",
    };
  },
};

// ============================================================
// Goals
// ============================================================

export const GoalRowSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: GoalTypeSchema,
  targetAmount: z.number(),
  targetDate: z.string(),
  priority: z.number().int(),
  status: GoalStatusSchema,
  notes: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type GoalRow = z.infer<typeof GoalRowSchema>;

export const GoalCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: GoalTypeSchema,
  targetAmount: z.number().positive("Target amount must be positive"),
  targetDate: z.string().min(1, "Target date is required"),
  priority: z.number().int().positive().default(1),
  status: GoalStatusSchema.default("active"),
  notes: z.string().default(""),
});
export type GoalCreate = z.infer<typeof GoalCreateSchema>;

export const goalsDef: TabDef<GoalRow, GoalCreate> = {
  name: "Goals",
  headers: [
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
  rowSchema: GoalRowSchema,
  createSchema: GoalCreateSchema,
  parseRow(cells) {
    return {
      id: parseReqStr(cells[0], "id"),
      name: parseReqStr(cells[1], "name"),
      type: GoalTypeSchema.parse(cells[2]),
      targetAmount: parseNum(cells[3], "targetAmount"),
      targetDate: parseReqStr(cells[4], "targetDate"),
      priority: parseIntField(cells[5], "priority"),
      status: GoalStatusSchema.parse(cells[6]),
      notes: parseOptStr(cells[7]),
      createdAt: parseReqStr(cells[8], "createdAt"),
      updatedAt: parseReqStr(cells[9], "updatedAt"),
    };
  },
  serializeRow(row) {
    return [
      row.id,
      row.name,
      row.type,
      row.targetAmount,
      row.targetDate,
      row.priority,
      row.status,
      row.notes,
      row.createdAt,
      row.updatedAt,
    ];
  },
  createRow(input) {
    const now = new Date().toISOString();
    return {
      id: randomUUID(),
      name: input.name,
      type: input.type,
      targetAmount: input.targetAmount,
      targetDate: input.targetDate,
      priority: input.priority,
      status: input.status,
      notes: input.notes,
      createdAt: now,
      updatedAt: now,
    };
  },
};

// ============================================================
// Contributions
// ============================================================

export const ContributionRowSchema = z.object({
  id: z.string(),
  goalId: z.string(),
  amount: z.number(),
  date: z.string(),
  note: z.string(),
  createdAt: z.string(),
});
export type ContributionRow = z.infer<typeof ContributionRowSchema>;

export const ContributionCreateSchema = z.object({
  goalId: z.string().min(1, "goalId is required"),
  amount: z.number().positive("Amount must be positive"),
  date: z.string().min(1, "Date is required"),
  note: z.string().default(""),
});
export type ContributionCreate = z.infer<typeof ContributionCreateSchema>;

export const contributionDef: TabDef<ContributionRow, ContributionCreate> = {
  name: "Contributions",
  headers: ["id", "goalId", "amount", "date", "note", "createdAt"],
  rowSchema: ContributionRowSchema,
  createSchema: ContributionCreateSchema,
  parseRow(cells) {
    return {
      id: parseReqStr(cells[0], "id"),
      goalId: parseReqStr(cells[1], "goalId"),
      amount: parseNum(cells[2], "amount"),
      date: parseReqStr(cells[3], "date"),
      note: parseOptStr(cells[4]),
      createdAt: parseReqStr(cells[5], "createdAt"),
    };
  },
  serializeRow(row) {
    return [
      row.id,
      row.goalId,
      row.amount,
      row.date,
      row.note,
      row.createdAt,
    ];
  },
  createRow(input) {
    const now = new Date().toISOString();
    return {
      id: randomUUID(),
      goalId: input.goalId,
      amount: input.amount,
      date: input.date,
      note: input.note,
      createdAt: now,
    };
  },
};

// ============================================================
// Settings (key-value, no id — handled separately)
// ============================================================

export const SETTINGS_HEADERS = ["key", "value"] as const;
