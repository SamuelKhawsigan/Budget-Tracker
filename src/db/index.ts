import Database from "@tauri-apps/plugin-sql";
import { derivedBalance } from "../lib/balance";

let dbPromise: Promise<Database> | null = null;

// SQLite's foreign_keys pragma is per-connection (not persisted in the
// database file), so it must be re-issued every time a connection opens.
export function getDb(): Promise<Database> {
  if (!dbPromise) {
    dbPromise = Database.load("sqlite:budget.db")
      .then(async (db) => {
        await db.execute("PRAGMA foreign_keys = ON;");
        return db;
      })
      .catch((e) => {
        // Clear the cached promise on failure so a later retry (e.g. from the
        // splash screen's "Retry" button) attempts a fresh connection instead
        // of just returning the same rejected promise forever.
        dbPromise = null;
        throw e;
      });
  }
  return dbPromise;
}

export async function getAccountBalance(db: Database, accountId: number): Promise<number> {
  const accountRows = await db.select<{ opening_balance: number }[]>(
    "SELECT opening_balance FROM accounts WHERE id = ?",
    [accountId],
  );
  if (accountRows.length === 0) {
    throw new Error(`Account ${accountId} not found`);
  }

  const sumRows = await db.select<{ total: number | null }[]>(
    "SELECT SUM(amount) as total FROM transactions WHERE account_id = ?",
    [accountId],
  );

  return derivedBalance(accountRows[0].opening_balance, sumRows[0].total ?? 0);
}
