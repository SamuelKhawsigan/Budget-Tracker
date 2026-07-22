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
