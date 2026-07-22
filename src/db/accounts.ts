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
