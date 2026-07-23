import type Database from "@tauri-apps/plugin-sql";
import { getMonthCashSummary } from "./budgets";
import { shiftMonth } from "../lib/month";

export interface CategorySpending {
  category_id: number;
  category_name: string;
  group_name: string;
  color: string | null;
  icon: string | null;
  spent: number; // minor units, positive magnitude
}

// All expense spending this month by category (not just budgeted categories)
// — feeds the "spending by category" chart. type='transfer' is excluded by
// only summing type='expense'.
export async function getCategorySpending(db: Database, month: string): Promise<CategorySpending[]> {
  return db.select<CategorySpending[]>(
    `SELECT c.id as category_id, c.name as category_name, p.name as group_name,
            c.color as color, c.icon as icon,
            -SUM(t.amount) as spent
     FROM transactions t
     JOIN categories c ON c.id = t.category_id
     JOIN categories p ON p.id = c.parent_id
     WHERE t.type = 'expense' AND strftime('%Y-%m', t.date) = ?
     GROUP BY c.id
     HAVING spent > 0
     ORDER BY spent DESC`,
    [month],
  );
}

export interface MonthTrendPoint {
  month: string;
  income: number;
  expense: number;
  available: number;
}

// The last `count` months ending at (and including) endMonth, each computed
// via the same getMonthCashSummary used everywhere else — no separate
// aggregation logic to drift out of sync.
export async function getMonthTrend(
  db: Database,
  endMonth: string,
  count: number,
): Promise<MonthTrendPoint[]> {
  const months = Array.from({ length: count }, (_, i) => shiftMonth(endMonth, -(count - 1 - i)));

  return Promise.all(
    months.map(async (month) => {
      const cash = await getMonthCashSummary(db, month);
      return { month, income: cash.income, expense: cash.expense, available: cash.available };
    }),
  );
}
