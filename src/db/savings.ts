import type Database from "@tauri-apps/plugin-sql";
import { getMonthCashSummary } from "./budgets";
import { createTransfer } from "./transfers";
import { lastDayOfMonth } from "../lib/month";

export type SweepRule = "net" | "positive";

interface BudgetedCategoryActual {
  cap: number;
  spent: number;
}

async function listBudgetedActuals(db: Database, month: string): Promise<BudgetedCategoryActual[]> {
  const rows = await db.select<{ amount: number; spent: number }[]>(
    `SELECT b.amount as amount, COALESCE(-tx.total, 0) as spent
     FROM budgets b
     LEFT JOIN (
       SELECT category_id, SUM(amount) as total
       FROM transactions
       WHERE type = 'expense' AND strftime('%Y-%m', date) = ?
       GROUP BY category_id
     ) tx ON tx.category_id = b.category_id
     WHERE b.month = ?`,
    [month, month],
  );
  return rows.map((r) => ({ cap: r.amount, spent: r.spent }));
}

// 'net' (default): total budgeted minus total spent across budgeted categories.
// 'positive': sum only the categories that came in under budget — an
// over-budget category contributes 0 rather than a negative, so it can't eat
// into another category's surplus. Saves more aggressively than 'net'.
function computeRawLeftover(actuals: BudgetedCategoryActual[], rule: SweepRule): number {
  if (rule === "positive") {
    return actuals.reduce((sum, a) => sum + Math.max(a.cap - a.spent, 0), 0);
  }
  return actuals.reduce((sum, a) => sum + (a.cap - a.spent), 0);
}

export interface ProjectedSavings {
  rawLeftover: number; // per sweep_rule, before clamping — can be negative
  availableCash: number; // income - expense this month, across all accounts
  swept: number; // clamp(rawLeftover, 0, availableCash) — never phantom money
}

// The clamp is what makes irregular income safe: the raw leftover reflects
// budgeting discipline only (unbudgeted spending isn't subtracted from it),
// so availableCash — real income minus ALL spending this month — is the hard
// ceiling. A lean month sweeps less, or nothing, never money that isn't there.
export async function getProjectedSavings(
  db: Database,
  month: string,
  rule: SweepRule,
): Promise<ProjectedSavings> {
  const [actuals, cash] = await Promise.all([
    listBudgetedActuals(db, month),
    getMonthCashSummary(db, month),
  ]);
  const rawLeftover = computeRawLeftover(actuals, rule);
  const swept = Math.max(0, Math.min(rawLeftover, cash.available));
  return { rawLeftover, availableCash: cash.available, swept };
}

export interface SavingsSweep {
  id: number;
  month: string;
  amount: number;
  transfer_id: number;
  rule: SweepRule;
  clamped: number; // 0/1, SQLite boolean convention used elsewhere in this schema
  created_at: string;
}

export async function getSweepForMonth(db: Database, month: string): Promise<SavingsSweep | null> {
  const rows = await db.select<SavingsSweep[]>("SELECT * FROM savings_sweeps WHERE month = ?", [month]);
  return rows[0] ?? null;
}

// All-time, most recent first — feeds the Savings page's history card. This
// data has existed in the DB since Phase 6 but was never surfaced anywhere.
export async function listSavingsSweeps(db: Database): Promise<SavingsSweep[]> {
  return db.select<SavingsSweep[]>("SELECT * FROM savings_sweeps ORDER BY month DESC");
}

// Realizes the sweep: writes the linked-pair transfer from the source account
// into savings, then records the savings_sweeps row tying it to this month.
// One sweep per month — savings_sweeps.month is UNIQUE. rule/clamped are
// recorded at sweep time since sweep_rule is a global setting that can change
// later — without capturing it here, a past sweep's rule would be unrecoverable.
export async function closeMonth(
  db: Database,
  month: string,
  fromAccountId: number,
  toAccountId: number,
  amount: number,
  rule: SweepRule,
  clamped: boolean,
): Promise<void> {
  if (amount <= 0) {
    throw new Error("Nothing to sweep this month");
  }
  const existing = await getSweepForMonth(db, month);
  if (existing) {
    throw new Error(`${month} has already been swept`);
  }

  const transferId = await createTransfer(db, {
    fromAccountId,
    toAccountId,
    date: lastDayOfMonth(month),
    amount,
    notes: `Savings sweep for ${month}`,
  });

  await db.execute(
    "INSERT INTO savings_sweeps (month, amount, transfer_id, rule, clamped) VALUES (?, ?, ?, ?, ?)",
    [month, amount, transferId, rule, clamped ? 1 : 0],
  );
}

// Undoes a month's sweep: deletes both legs of its transfer and the
// savings_sweeps row, so the month is free to be swept again. No-op if the
// month was never swept.
export async function undoSweep(db: Database, month: string): Promise<void> {
  const sweep = await getSweepForMonth(db, month);
  if (!sweep) return;

  // sweep.transfer_id is the outgoing leg; its partner is the incoming leg.
  const partners = await db.select<{ id: number }[]>(
    "SELECT id FROM transactions WHERE transfer_id = ?",
    [sweep.transfer_id],
  );
  const legs = [sweep.transfer_id, ...partners.map((p) => p.id)];
  const ph = legs.map(() => "?").join(",");

  await db.execute(`UPDATE transactions SET transfer_id = NULL WHERE id IN (${ph})`, legs);
  await db.execute("DELETE FROM savings_sweeps WHERE month = ?", [month]);
  await db.execute(`DELETE FROM transactions WHERE id IN (${ph})`, legs);
}
