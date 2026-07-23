import type Database from "@tauri-apps/plugin-sql";
import type { Account, AccountType } from "../types";
import { getAccountBalance } from "./index";

export interface AccountWithBalance extends Account {
  balance: number;
}

export interface AccountInput {
  name: string;
  type: AccountType;
  currency: string;
  openingBalance: number;
}

// Balances are always derived through getAccountBalance (opening_balance +
// SUM(amount)) rather than recomputed here, so there is one source of truth.
export async function listAccounts(
  db: Database,
  includeArchived = false,
): Promise<AccountWithBalance[]> {
  const rows = await db.select<Account[]>(
    includeArchived
      ? "SELECT * FROM accounts ORDER BY sort_order, id"
      : "SELECT * FROM accounts WHERE is_archived = 0 ORDER BY sort_order, id",
  );

  return Promise.all(
    rows.map(async (account) => ({
      ...account,
      balance: await getAccountBalance(db, account.id),
    })),
  );
}

export async function getAccount(db: Database, id: number): Promise<Account | null> {
  const rows = await db.select<Account[]>("SELECT * FROM accounts WHERE id = ?", [id]);
  return rows[0] ?? null;
}

export async function createAccount(db: Database, input: AccountInput): Promise<number> {
  const result = await db.execute(
    "INSERT INTO accounts (name, type, currency, opening_balance) VALUES (?, ?, ?, ?)",
    [input.name, input.type, input.currency, input.openingBalance],
  );
  if (result.lastInsertId == null) {
    throw new Error("Insert did not return a row id");
  }
  return result.lastInsertId;
}

export async function updateAccount(db: Database, id: number, input: AccountInput): Promise<void> {
  await db.execute(
    "UPDATE accounts SET name = ?, type = ?, currency = ?, opening_balance = ? WHERE id = ?",
    [input.name, input.type, input.currency, input.openingBalance, id],
  );
}

// Accounts are archived, never hard-deleted, so historical transactions never orphan.
export async function setAccountArchived(db: Database, id: number, archived: boolean): Promise<void> {
  await db.execute("UPDATE accounts SET is_archived = ? WHERE id = ?", [archived ? 1 : 0, id]);
}

export interface AccountDependencyInfo {
  transactionCount: number;
}

export async function getAccountDependencyInfo(
  db: Database,
  id: number,
): Promise<AccountDependencyInfo> {
  const rows = await db.select<{ n: number }[]>(
    "SELECT COUNT(*) as n FROM transactions WHERE account_id = ?",
    [id],
  );
  return { transactionCount: rows[0]?.n ?? 0 };
}

// Permanent cascade delete (the explicit alternative to archive). Removes the
// account, all its transactions, the PARTNER leg of any transfer that touches
// it (never orphan a half-transfer, even into another account), and any
// savings_sweeps whose transfer got deleted. Clears the savings-account
// setting if this was that account, so it can't dangle.
export async function deleteAccountCascade(db: Database, id: number): Promise<void> {
  const own = await db.select<{ id: number }[]>(
    "SELECT id FROM transactions WHERE account_id = ?",
    [id],
  );
  const ids = new Set(own.map((r) => r.id));

  if (ids.size > 0) {
    const ph = [...ids].map(() => "?").join(",");
    const partners = await db.select<{ id: number }[]>(
      `SELECT id FROM transactions WHERE transfer_id IN (${ph})`,
      [...ids],
    );
    for (const p of partners) ids.add(p.id);
  }

  if (ids.size > 0) {
    const list = [...ids];
    const ph = list.map(() => "?").join(",");
    // Break self-referential transfer links so the delete can't trip the FK,
    // remove sweeps pointing at any deleted leg (NOT NULL FK), then the rows.
    await db.execute(`UPDATE transactions SET transfer_id = NULL WHERE transfer_id IN (${ph})`, list);
    await db.execute(`DELETE FROM savings_sweeps WHERE transfer_id IN (${ph})`, list);
    await db.execute(`DELETE FROM transactions WHERE id IN (${ph})`, list);
  }

  await db.execute("DELETE FROM settings WHERE key = 'savings_account_id' AND value = ?", [String(id)]);
  await db.execute("DELETE FROM accounts WHERE id = ?", [id]);
}
