import type Database from "@tauri-apps/plugin-sql";

export interface TransactionWithDetails {
  id: number;
  account_id: number;
  date: string;
  amount: number;
  type: "income" | "expense" | "transfer";
  category_id: number | null;
  payee_id: number | null;
  notes: string | null;
  is_cleared: number;
  category_name: string | null;
  payee_name: string | null;
}

export interface TransactionFilter {
  search?: string;
  categoryId?: number;
  type?: "income" | "expense";
}

// Excludes type = 'transfer' — this is the income/expense loop; transfers
// (Phase 4) get their own linked-pair entry point and must stay out of here
// so they don't double up as spending.
export async function listTransactions(
  db: Database,
  accountId: number,
  filter: TransactionFilter = {},
): Promise<TransactionWithDetails[]> {
  const conditions = ["t.account_id = ?", "t.type != 'transfer'"];
  const params: unknown[] = [accountId];

  if (filter.type) {
    conditions.push("t.type = ?");
    params.push(filter.type);
  }
  if (filter.categoryId != null) {
    conditions.push("t.category_id = ?");
    params.push(filter.categoryId);
  }
  if (filter.search) {
    conditions.push("(t.notes LIKE ? OR p.name LIKE ? OR c.name LIKE ?)");
    const like = `%${filter.search}%`;
    params.push(like, like, like);
  }

  return db.select<TransactionWithDetails[]>(
    `SELECT t.id, t.account_id, t.date, t.amount, t.type, t.category_id, t.payee_id,
            t.notes, t.is_cleared, c.name as category_name, p.name as payee_name
     FROM transactions t
     LEFT JOIN categories c ON c.id = t.category_id
     LEFT JOIN payees p ON p.id = t.payee_id
     WHERE ${conditions.join(" AND ")}
     ORDER BY t.date DESC, t.id DESC`,
    params,
  );
}

export interface PayeeTransactionRow {
  id: number;
  account_id: number;
  account_name: string;
  currency: string;
  date: string;
  amount: number;
  type: "income" | "expense";
  category_name: string | null;
  notes: string | null;
}

// A payee isn't scoped to one account, so this spans all of them (unlike
// listTransactions) — feeds the payee tile's "drill through" view.
export async function listTransactionsByPayee(db: Database, payeeId: number): Promise<PayeeTransactionRow[]> {
  return db.select<PayeeTransactionRow[]>(
    `SELECT t.id, t.account_id, a.name as account_name, a.currency as currency,
            t.date, t.amount, t.type, c.name as category_name, t.notes
     FROM transactions t
     JOIN accounts a ON a.id = t.account_id
     LEFT JOIN categories c ON c.id = t.category_id
     WHERE t.payee_id = ? AND t.type != 'transfer'
     ORDER BY t.date DESC, t.id DESC`,
    [payeeId],
  );
}

export interface TransactionInput {
  accountId: number;
  date: string;
  amount: number;
  type: "income" | "expense";
  categoryId: number | null;
  payeeId: number | null;
  notes: string | null;
}

export async function createTransaction(db: Database, input: TransactionInput): Promise<number> {
  const result = await db.execute(
    `INSERT INTO transactions (account_id, date, amount, type, category_id, payee_id, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [input.accountId, input.date, input.amount, input.type, input.categoryId, input.payeeId, input.notes],
  );
  if (result.lastInsertId == null) {
    throw new Error("Insert did not return a row id");
  }
  return result.lastInsertId;
}

export async function updateTransaction(db: Database, id: number, input: TransactionInput): Promise<void> {
  await db.execute(
    `UPDATE transactions
     SET date = ?, amount = ?, type = ?, category_id = ?, payee_id = ?, notes = ?, updated_at = datetime('now')
     WHERE id = ?`,
    [input.date, input.amount, input.type, input.categoryId, input.payeeId, input.notes, id],
  );
}

export async function deleteTransaction(db: Database, id: number): Promise<void> {
  await db.execute("DELETE FROM transactions WHERE id = ?", [id]);
}

// Hashes already seen for an account, so CSV import review can flag
// duplicates client-side before anything is written. The unique partial
// index on import_hash (WHERE import_hash IS NOT NULL) is still the ultimate
// backstop at insert time.
export async function getExistingImportHashes(db: Database, accountId: number): Promise<Set<string>> {
  const rows = await db.select<{ import_hash: string }[]>(
    "SELECT import_hash FROM transactions WHERE account_id = ? AND import_hash IS NOT NULL",
    [accountId],
  );
  return new Set(rows.map((r) => r.import_hash));
}

export interface ImportedTransactionInput extends TransactionInput {
  importHash: string;
}

export async function createImportedTransaction(
  db: Database,
  input: ImportedTransactionInput,
): Promise<number> {
  const result = await db.execute(
    `INSERT INTO transactions (account_id, date, amount, type, category_id, payee_id, notes, import_hash)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.accountId,
      input.date,
      input.amount,
      input.type,
      input.categoryId,
      input.payeeId,
      input.notes,
      input.importHash,
    ],
  );
  if (result.lastInsertId == null) {
    throw new Error("Insert did not return a row id");
  }
  return result.lastInsertId;
}
