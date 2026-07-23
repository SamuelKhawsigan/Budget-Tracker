import { useCallback, useEffect, useState } from "react";
import type Database from "@tauri-apps/plugin-sql";
import {
  deleteBudget,
  getMonthCashSummary,
  listCategoryBudgetSummaries,
  setBudget,
  type CategoryBudgetSummary,
  type MonthCashSummary,
} from "../db/budgets";
import { getSetting } from "../db/settings";
import { BudgetCategoryRow } from "../components/BudgetCategoryRow";
import { MonthNav } from "../components/MonthNav";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { useDeleteFlow } from "../lib/useDeleteFlow";
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
  const del = useDeleteFlow(setError);

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

  function handleDeleteRequest(summary: CategoryBudgetSummary) {
    setError(null);
    del.request({
      title: "Remove budget",
      confirmLabel: "Remove budget",
      message: (
        <>
          Remove the cap for <strong>{summary.category_name}</strong> in {monthLabel(month)}? Spending
          history is untouched.
        </>
      ),
      run: async () => {
        await deleteBudget(db, summary.category_id, month);
        await refresh();
      },
    });
  }

  return (
    <>
      <h1>Budgets</h1>

      <MonthNav month={month} onChange={setMonth} shift={shiftMonth} />

      {error && <p className="form-error">{error}</p>}

      {budgetingMode === "available" && cash && (
        <div className="cash-summary">
          <span>
            Income <span className="figure">{fromMinorUnits(cash.income)}</span>
          </span>
          <span>
            Spent <span className="figure">{fromMinorUnits(cash.expense)}</span>
          </span>
          <span className={cash.available < 0 ? "negative" : "positive"}>
            Available to budget <span className="figure">{fromMinorUnits(cash.available)}</span>
          </span>
        </div>
      )}

      <div className="card">
        {summaries.length === 0 ? (
          <p className="empty-state">No expense categories yet — add some in Categories.</p>
        ) : (
          <>
            <div className="budget-head">
              <span />
              <span>Category</span>
              <span className="budget-num">Cap</span>
              <span className="budget-num">Spent</span>
              <span className="budget-num">Remaining</span>
              <span />
            </div>
            <ul className="entity-list">
              {summaries.map((s) => (
                <BudgetCategoryRow
                  key={s.category_id}
                  summary={s}
                  onSave={handleSaveBudget}
                  onDelete={handleDeleteRequest}
                />
              ))}
            </ul>
          </>
        )}
      </div>

      {del.pending && (
        <ConfirmDialog
          title={del.pending.title}
          message={del.pending.message}
          confirmLabel={del.pending.confirmLabel}
          busy={del.busy}
          onConfirm={del.confirm}
          onCancel={del.cancel}
        />
      )}
    </>
  );
}
