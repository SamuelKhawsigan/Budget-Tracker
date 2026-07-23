import { beforeEach, describe, expect, it } from "vitest";
import initSqlJs, { type Database as SqlJsDatabase } from "sql.js";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import type Database from "@tauri-apps/plugin-sql";
import { deleteAccountCascade, getAccountDependencyInfo } from "./accounts";
import { deleteCategoryCascade, getCategoryDependencyInfo } from "./categories";
import { deletePayee, getPayeeDependencyInfo } from "./payees";
import { deleteBudget, setBudget } from "./budgets";
import { undoSweep } from "./savings";
import { createTransfer, deleteTransfer } from "./transfers";

// Load the WASM binary and the real migration schema so the test DB is exactly
// the shipping schema (FKs and all) — no hand-maintained duplicate to drift.
const require = createRequire(import.meta.url);
const wasmBinary = readFileSync(require.resolve("sql.js/dist/sql-wasm.wasm"));
const schema = readFileSync(new URL("../../src-tauri/migrations/0001_init.sql", import.meta.url), "utf8");
const sqlReady = initSqlJs({ wasmBinary });

// Adapter presenting sql.js through the same execute/select surface the app's
// db functions use, so they run unmodified against a real (in-memory) SQLite
// with foreign keys enforced.
async function makeDb(): Promise<{ db: Database; raw: SqlJsDatabase }> {
  const SQL = await sqlReady;
  const raw = new SQL.Database();
  raw.run(schema);
  raw.run("PRAGMA foreign_keys = ON;");

  const db = {
    async execute(sql: string, params: unknown[] = []) {
      raw.run(sql, params as never);
      const res = raw.exec("SELECT last_insert_rowid() AS id");
      const lastInsertId = res[0]?.values[0]?.[0] as number;
      return { lastInsertId, rowsAffected: raw.getRowsModified() };
    },
    async select<T>(sql: string, params: unknown[] = []): Promise<T> {
      const stmt = raw.prepare(sql);
      stmt.bind(params as never);
      const out: unknown[] = [];
      while (stmt.step()) out.push(stmt.getAsObject());
      stmt.free();
      return out as T;
    },
  };

  return { db: db as unknown as Database, raw };
}

async function count(db: Database, table: string): Promise<number> {
  const rows = await db.select<{ n: number }[]>(`SELECT COUNT(*) as n FROM ${table}`);
  return rows[0].n;
}

// db.execute's lastInsertId is typed number|undefined (the plugin's QueryResult);
// in these fixtures every insert yields an id, so assert it.
async function insertId(db: Database, sql: string, params: unknown[] = []): Promise<number> {
  const r = await db.execute(sql, params);
  if (r.lastInsertId == null) throw new Error("insert returned no id");
  return r.lastInsertId;
}

async function insertAccount(db: Database, name: string, type = "checking"): Promise<number> {
  return insertId(db, "INSERT INTO accounts (name, type) VALUES (?, ?)", [name, type]);
}

async function insertExpense(
  db: Database,
  accountId: number,
  amount: number,
  opts: { categoryId?: number; payeeId?: number; date?: string } = {},
): Promise<number> {
  return insertId(
    db,
    "INSERT INTO transactions (account_id, date, amount, type, category_id, payee_id) VALUES (?, ?, ?, 'expense', ?, ?)",
    [accountId, opts.date ?? "2026-07-01", amount, opts.categoryId ?? null, opts.payeeId ?? null],
  );
}

describe("account delete (cascade)", () => {
  let db: Database;
  beforeEach(async () => ({ db } = await makeDb()));

  it("reports its transaction count", async () => {
    const a = await insertAccount(db, "A");
    await insertExpense(db, a, -100);
    await insertExpense(db, a, -200);
    expect(await getAccountDependencyInfo(db, a)).toEqual({ transactionCount: 2 });
  });

  it("removes the account and all its transactions", async () => {
    const a = await insertAccount(db, "A");
    await insertExpense(db, a, -100);
    await insertExpense(db, a, -200);
    await deleteAccountCascade(db, a);
    expect(await count(db, "accounts")).toBe(0);
    expect(await count(db, "transactions")).toBe(0);
  });

  it("removes the PARTNER leg of a transfer into another account", async () => {
    const a = await insertAccount(db, "A");
    const b = await insertAccount(db, "B", "savings");
    await createTransfer(db, { fromAccountId: a, toAccountId: b, date: "2026-07-01", amount: 1000, notes: null });
    expect(await count(db, "transactions")).toBe(2);
    await deleteAccountCascade(db, a);
    // both legs gone, and account B still exists
    expect(await count(db, "transactions")).toBe(0);
    expect(await count(db, "accounts")).toBe(1);
  });

  it("removes savings_sweeps that referenced a deleted transfer leg", async () => {
    const a = await insertAccount(db, "A");
    const b = await insertAccount(db, "B", "savings");
    const legId = await createTransfer(db, {
      fromAccountId: a,
      toAccountId: b,
      date: "2026-07-31",
      amount: 500,
      notes: null,
    });
    await db.execute("INSERT INTO savings_sweeps (month, amount, transfer_id) VALUES (?, ?, ?)", [
      "2026-07",
      500,
      legId,
    ]);
    await deleteAccountCascade(db, a);
    expect(await count(db, "savings_sweeps")).toBe(0);
    expect(await count(db, "transactions")).toBe(0);
  });

  it("clears the savings-account setting when that account is deleted", async () => {
    const b = await insertAccount(db, "Savings", "savings");
    await db.execute("INSERT INTO settings (key, value) VALUES ('savings_account_id', ?)", [String(b)]);
    await deleteAccountCascade(db, b);
    const rows = await db.select<{ value: string }[]>(
      "SELECT value FROM settings WHERE key = 'savings_account_id'",
    );
    expect(rows).toHaveLength(0);
  });
});

describe("category delete (reassign to Uncategorized)", () => {
  let db: Database;
  beforeEach(async () => ({ db } = await makeDb()));

  async function group(name: string): Promise<number> {
    return insertId(db, "INSERT INTO categories (name, parent_id, kind) VALUES (?, NULL, 'expense')", [name]);
  }
  async function leaf(name: string, parentId: number): Promise<number> {
    return insertId(db, "INSERT INTO categories (name, parent_id, kind) VALUES (?, ?, 'expense')", [
      name,
      parentId,
    ]);
  }

  it("nulls category_id on transactions, drops budgets, clears payee defaults", async () => {
    const a = await insertAccount(db, "A");
    const g = await group("Food");
    const l = await leaf("Groceries", g);
    const txId = await insertExpense(db, a, -100, { categoryId: l });
    await setBudget(db, l, "2026-07", 5000);
    await db.execute("INSERT INTO payees (name, default_category_id) VALUES ('Shop', ?)", [l]);

    expect(await getCategoryDependencyInfo(db, l)).toEqual({
      isGroup: false,
      leafCount: 0,
      transactionCount: 1,
    });

    await deleteCategoryCascade(db, l);

    const tx = await db.select<{ category_id: number | null }[]>(
      "SELECT category_id FROM transactions WHERE id = ?",
      [txId],
    );
    expect(tx[0].category_id).toBeNull();
    expect(await count(db, "budgets")).toBe(0);
    const payee = await db.select<{ default_category_id: number | null }[]>(
      "SELECT default_category_id FROM payees",
    );
    expect(payee[0].default_category_id).toBeNull();
    expect(await count(db, "categories")).toBe(1); // group remains, leaf gone
  });

  it("deleting a group removes its leaves and reassigns their transactions", async () => {
    const a = await insertAccount(db, "A");
    const g = await group("Food");
    const l1 = await leaf("Groceries", g);
    await leaf("Dining", g);
    const txId = await insertExpense(db, a, -100, { categoryId: l1 });

    expect(await getCategoryDependencyInfo(db, g)).toEqual({
      isGroup: true,
      leafCount: 2,
      transactionCount: 1,
    });

    await deleteCategoryCascade(db, g);

    expect(await count(db, "categories")).toBe(0);
    const tx = await db.select<{ category_id: number | null }[]>(
      "SELECT category_id FROM transactions WHERE id = ?",
      [txId],
    );
    expect(tx[0].category_id).toBeNull();
  });
});

describe("payee delete (null out payee_id)", () => {
  let db: Database;
  beforeEach(async () => ({ db } = await makeDb()));

  it("keeps the transactions but clears their payee reference", async () => {
    const a = await insertAccount(db, "A");
    const p = await insertId(db, "INSERT INTO payees (name) VALUES ('Shop')");
    const txId = await insertExpense(db, a, -100, { payeeId: p });

    expect(await getPayeeDependencyInfo(db, p)).toEqual({ transactionCount: 1 });

    await deletePayee(db, p);

    expect(await count(db, "payees")).toBe(0);
    const tx = await db.select<{ payee_id: number | null }[]>(
      "SELECT payee_id FROM transactions WHERE id = ?",
      [txId],
    );
    expect(tx[0].payee_id).toBeNull();
    expect(await count(db, "transactions")).toBe(1);
  });
});

describe("budget delete", () => {
  let db: Database;
  beforeEach(async () => ({ db } = await makeDb()));

  it("removes only the targeted category/month cap", async () => {
    const g = await insertId(
      db,
      "INSERT INTO categories (name, parent_id, kind) VALUES ('Food', NULL, 'expense')",
    );
    await setBudget(db, g, "2026-07", 5000);
    await setBudget(db, g, "2026-08", 6000);
    await deleteBudget(db, g, "2026-07");
    const rows = await db.select<{ month: string }[]>("SELECT month FROM budgets");
    expect(rows).toEqual([{ month: "2026-08" }]);
  });
});

describe("transfer delete (both legs)", () => {
  let db: Database;
  beforeEach(async () => ({ db } = await makeDb()));

  it("removes both legs given only one leg id", async () => {
    const a = await insertAccount(db, "A");
    const b = await insertAccount(db, "B", "savings");
    const legId = await createTransfer(db, {
      fromAccountId: a,
      toAccountId: b,
      date: "2026-07-01",
      amount: 1000,
      notes: null,
    });
    await deleteTransfer(db, legId);
    expect(await count(db, "transactions")).toBe(0);
  });
});

describe("undo sweep", () => {
  let db: Database;
  beforeEach(async () => ({ db } = await makeDb()));

  it("removes both transfer legs and the sweep row, freeing the month", async () => {
    const a = await insertAccount(db, "A");
    const b = await insertAccount(db, "B", "savings");
    const legId = await createTransfer(db, {
      fromAccountId: a,
      toAccountId: b,
      date: "2026-07-31",
      amount: 500,
      notes: null,
    });
    await db.execute("INSERT INTO savings_sweeps (month, amount, transfer_id) VALUES ('2026-07', 500, ?)", [
      legId,
    ]);

    await undoSweep(db, "2026-07");

    expect(await count(db, "savings_sweeps")).toBe(0);
    expect(await count(db, "transactions")).toBe(0);
  });
});
