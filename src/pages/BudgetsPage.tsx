import { useCallback, useEffect, useState } from "react";
import type Database from "@tauri-apps/plugin-sql";
import {
  getMonthCashSummary,
  listCategoryBudgetSummaries,
  setBudget,
  type CategoryBudgetSummary,
  type MonthCashSummary,
} from "../db/budgets";
import { getSetting } from "../db/settings";
import { BudgetCategoryRow } from "../components/BudgetCategoryRow";
import { fromMinorUnits } from "../lib/money";
import { currentMonth, monthLabel, shiftMonth } from "../lib/month";

interface BudgetsPageProps {
  db: Database;
}

export function BudgetsPage({ db }: BudgetsPageProps) {
  const [month, setMonth] = useState(currentMonth());
  const [summaries, setSummaries] = useState<CategoryBudgetSummary[]>([]);
  const [cash, setCash] = useState<MonthCashSummary | null>(null);
  const [budgetingMode, setBudgetingMode] = useState("available");
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const [summary, cashSummary] = await Promise.all([
      listCategoryBudgetSummaries(db, month),
      getMonthCashSummary(db, month),
    ]);
    setSummaries(summary);
    setCash(cashSummary);
  }, [db, month]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    void getSetting(db, "budgeting_mode").then((mode) => setBudgetingMode(mode ?? "available"));
  }, [db]);

  async function handleSaveBudget(categoryId: number, amount: number) {
    setError(null);
    try {
      await setBudget(db, categoryId, month, amount);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <>
      <h1>Budgets</h1>

      <div className="month-nav">
        <button type="button" onClick={() => setMonth((m) => shiftMonth(m, -1))}>
          ← Prev
        </button>
        <span className="month-label">{monthLabel(month)}</span>
        <button type="button" onClick={() => setMonth((m) => shiftMonth(m, 1))}>
          Next →
        </button>
      </div>

      {error && <p className="form-error">{error}</p>}

      {budgetingMode === "available" && cash && (
        <div className="cash-summary">
          <span>Income: {fromMinorUnits(cash.income)}</span>
          <span>Spent: {fromMinorUnits(cash.expense)}</span>
          <span className={cash.available < 0 ? "negative" : "positive"}>
            Available to budget: {fromMinorUnits(cash.available)}
          </span>
        </div>
      )}

      {summaries.length === 0 ? (
        <p className="empty-state">No expense categories yet — add some in Categories.</p>
      ) : (
        <table className="budget-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Cap</th>
              <th>Spent</th>
              <th>Remaining</th>
            </tr>
          </thead>
          <tbody>
            {summaries.map((s) => (
              <BudgetCategoryRow key={s.category_id} summary={s} onSave={handleSaveBudget} />
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
