import type Database from "@tauri-apps/plugin-sql";
import type { Payee } from "../types";

export async function listPayees(db: Database): Promise<Payee[]> {
  return db.select<Payee[]>("SELECT * FROM payees WHERE is_archived = 0 ORDER BY name");
}

export async function getPayee(db: Database, id: number): Promise<Payee | null> {
  const rows = await db.select<Payee[]>("SELECT * FROM payees WHERE id = ?", [id]);
  return rows[0] ?? null;
}

export async function listAllPayees(db: Database, includeArchived = false): Promise<Payee[]> {
  return db.select<Payee[]>(
    includeArchived
      ? "SELECT * FROM payees ORDER BY name"
      : "SELECT * FROM payees WHERE is_archived = 0 ORDER BY name",
  );
}

// Used by the transaction quick-add: typing a payee name that doesn't exist
// yet just creates it (with no default category), so entry never blocks on a
// separate "add payee" step. Full editing (including default_category_id)
// happens on the payees management page.
export async function findOrCreatePayee(db: Database, name: string): Promise<number | null> {
  const trimmed = name.trim();
  if (!trimmed) return null;

  const existing = await db.select<{ id: number }[]>(
    "SELECT id FROM payees WHERE name = ? COLLATE NOCASE",
    [trimmed],
  );
  if (existing.length > 0) {
    return existing[0].id;
  }

  const result = await db.execute("INSERT INTO payees (name) VALUES (?)", [trimmed]);
  if (result.lastInsertId == null) {
    throw new Error("Insert did not return a row id");
  }
  return result.lastInsertId;
}

// Batch lookup for CSV import review: match parsed row descriptions against
// existing payees (read-only — nothing is created until the import commits)
// so rows with a payee default_category can be pre-filled.
export async function findPayeesByNames(db: Database, names: string[]): Promise<Map<string, Payee>> {
  const unique = Array.from(new Set(names.map((n) => n.trim()).filter(Boolean)));
  if (unique.length === 0) return new Map();

  const placeholders = unique.map(() => "?").join(",");
  const rows = await db.select<Payee[]>(
    `SELECT * FROM payees WHERE is_archived = 0 AND name COLLATE NOCASE IN (${placeholders})`,
    unique,
  );

  const map = new Map<string, Payee>();
  for (const p of rows) {
    map.set(p.name.toLowerCase(), p);
  }
  return map;
}

export interface PayeeInput {
  name: string;
  defaultCategoryId: number | null;
}

export async function createPayee(db: Database, input: PayeeInput): Promise<number> {
  const result = await db.execute("INSERT INTO payees (name, default_category_id) VALUES (?, ?)", [
    input.name,
    input.defaultCategoryId,
  ]);
  if (result.lastInsertId == null) {
    throw new Error("Insert did not return a row id");
  }
  return result.lastInsertId;
}

export async function updatePayee(db: Database, id: number, input: PayeeInput): Promise<void> {
  await db.execute("UPDATE payees SET name = ?, default_category_id = ? WHERE id = ?", [
    input.name,
    input.defaultCategoryId,
    id,
  ]);
}

// Lighter than updatePayee — used by the tile's inline category pill and the
// bulk-assign view, neither of which should touch the payee's name.
export async function setPayeeDefaultCategory(
  db: Database,
  id: number,
  categoryId: number | null,
): Promise<void> {
  await db.execute("UPDATE payees SET default_category_id = ? WHERE id = ?", [categoryId, id]);
}

export interface PayeeStats {
  count: number;
  total: number; // signed minor units (income positive, expense negative)
  lastUsed: string | null; // 'YYYY-MM-DD'
}

// One row per payee with transactions (payees with none just get no entry —
// callers default to zero/null). type != 'transfer' since payee_id is never
// set on a transfer leg anyway, but this keeps the intent explicit.
export async function getPayeeStats(db: Database): Promise<Map<number, PayeeStats>> {
  const rows = await db.select<{ payee_id: number; count: number; total: number; last_used: string }[]>(
    `SELECT payee_id, COUNT(*) as count, SUM(amount) as total, MAX(date) as last_used
     FROM transactions
     WHERE payee_id IS NOT NULL AND type != 'transfer'
     GROUP BY payee_id`,
  );
  return new Map(
    rows.map((r) => [r.payee_id, { count: r.count, total: r.total, lastUsed: r.last_used }]),
  );
}

export async function setPayeeArchived(db: Database, id: number, archived: boolean): Promise<void> {
  await db.execute("UPDATE payees SET is_archived = ? WHERE id = ?", [archived ? 1 : 0, id]);
}

export interface PayeeDependencyInfo {
  transactionCount: number;
}

export async function getPayeeDependencyInfo(db: Database, id: number): Promise<PayeeDependencyInfo> {
  const rows = await db.select<{ n: number }[]>(
    "SELECT COUNT(*) as n FROM transactions WHERE payee_id = ?",
    [id],
  );
  return { transactionCount: rows[0]?.n ?? 0 };
}

// Payees are the lightest case: their transactions keep everything except the
// payee reference (payee_id nulled), then the payee is removed.
export async function deletePayee(db: Database, id: number): Promise<void> {
  await db.execute("UPDATE transactions SET payee_id = NULL WHERE payee_id = ?", [id]);
  await db.execute("DELETE FROM payees WHERE id = ?", [id]);
}
