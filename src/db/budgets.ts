import type Database from "@tauri-apps/plugin-sql";

export interface CategoryBudgetSummary {
  category_id: number;
  category_name: string;
  group_name: string;
  color: string | null;
  icon: string | null;
  cap: number | null; // minor units; null = no budget row set for this month
  spent: number; // minor units, positive magnitude
}

// Budgets only apply to expense categories — "cap" / "spent" / health only
// make sense against spending. Each month is looked up independently (its own
// budget row, its own month's transactions), so there is no rollover: a
// category with no cap for this month shows cap = null regardless of past months.
export async function listCategoryBudgetSummaries(
  db: Database,
  month: string,
): Promise<CategoryBudgetSummary[]> {
  return db.select<CategoryBudgetSummary[]>(
    `SELECT c.id as category_id, c.name as category_name, p.name as group_name,
            c.color as color, c.icon as icon,
            b.amount as cap,
            COALESCE(-tx.total, 0) as spent
     FROM categories c
     JOIN categories p ON p.id = c.parent_id
     LEFT JOIN budgets b ON b.category_id = c.id AND b.month = ?
     LEFT JOIN (
       SELECT category_id, SUM(amount) as total
       FROM transactions
       WHERE type = 'expense' AND strftime('%Y-%m', date) = ?
       GROUP BY category_id
     ) tx ON tx.category_id = c.id
     WHERE c.kind = 'expense' AND c.is_archived = 0 AND p.is_archived = 0
     ORDER BY p.sort_order, c.sort_order`,
    [month, month],
  );
}

export type BudgetHealth = "good" | "warn" | "over" | "none";

// Shared by the Budgets page's per-row coloring and the Dashboard's
// budget-health-at-a-glance widget, so the two views can never disagree.
export function getBudgetHealth(cap: number | null, spent: number): BudgetHealth {
  if (cap == null || cap <= 0) return spent > 0 ? "over" : "none";
  const ratio = spent / cap;
  if (ratio > 1) return "over";
  if (ratio >= 0.8) return "warn";
  return "good";
}

export async function setBudget(
  db: Database,
  categoryId: number,
  month: string,
  amount: number,
): Promise<void> {
  await db.execute(
    `INSERT INTO budgets (category_id, month, amount) VALUES (?, ?, ?)
     ON CONFLICT(category_id, month) DO UPDATE SET amount = excluded.amount`,
    [categoryId, month, amount],
  );
}

// A budget row is a leaf with no dependents of its own, so deleting one cap
// for one month is unconditional. Clears the cap for that category/month;
// spending history is untouched.
export async function deleteBudget(db: Database, categoryId: number, month: string): Promise<void> {
  await db.execute("DELETE FROM budgets WHERE category_id = ? AND month = ?", [categoryId, month]);
}

export interface MonthCashSummary {
  income: number; // minor units, positive
  expense: number; // minor units, positive magnitude
  available: number; // income - expense
}

// Global across all accounts — a budget cap isn't scoped to one account, and
// this backs the 'available' budgeting mode's "money you actually have this
// month" figure. type='transfer' is excluded by only summing income/expense.
export async function getMonthCashSummary(db: Database, month: string): Promise<MonthCashSummary> {
  const rows = await db.select<{ type: "income" | "expense"; total: number }[]>(
    `SELECT type, SUM(amount) as total
     FROM transactions
     WHERE type IN ('income', 'expense') AND strftime('%Y-%m', date) = ?
     GROUP BY type`,
    [month],
  );
  const income = rows.find((r) => r.type === "income")?.total ?? 0;
  const expense = -(rows.find((r) => r.type === "expense")?.total ?? 0);
  return { income, expense, available: income - expense };
}
