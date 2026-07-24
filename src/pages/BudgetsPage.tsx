import { useCallback, useEffect, useState } from "react";
import type Database from "@tauri-apps/plugin-sql";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import {
  deleteBudget,
  getMonthCashSummary,
  listCategoryBudgetSummaries,
  setBudget,
  type CategoryBudgetSummary,
  type MonthCashSummary,
} from "../db/budgets";
import type { CategoryOption } from "../db/categories";
import { getSetting } from "../db/settings";
import { BudgetAllocationSummary } from "../components/BudgetAllocationSummary";
import { BudgetedCategoryCard } from "../components/BudgetedCategoryCard";
import { UnbudgetedChip } from "../components/UnbudgetedChip";
import { AddBudgetPopover } from "../components/AddBudgetPopover";
import { MonthNav } from "../components/MonthNav";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { useDeleteFlow } from "../lib/useDeleteFlow";
import { currentMonth, monthLabel, shiftMonth } from "../lib/month";

interface BudgetsPageProps {
  db: Database;
}

export function BudgetsPage({ db }: BudgetsPageProps) {
  const [month, setMonth] = useState(currentMonth());
  const [summaries, setSummaries] = useState<CategoryBudgetSummary[]>([]);
  const [cash, setCash] = useState<MonthCashSummary | null>(null);
  const [budgetingMode, setBudgetingMode] = useState("available");
  const [addBudgetAnchor, setAddBudgetAnchor] = useState<DOMRect | null>(null);
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

  async function handleAddBudgetSubmit(categoryId: number, amount: number) {
    await handleSaveBudget(categoryId, amount);
    setAddBudgetAnchor(null);
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

  const budgeted = summaries.filter((s) => s.cap != null);
  const notBudgeted = summaries.filter((s) => s.cap == null);
  const totalCap = budgeted.reduce((sum, s) => sum + (s.cap ?? 0), 0);
  const unbudgetedOptions: CategoryOption[] = notBudgeted.map((s) => ({
    id: s.category_id,
    name: s.category_name,
    kind: "expense",
    group_name: s.group_name,
    color: s.color,
    icon: s.icon,
  }));

  return (
    <>
      <h1>Budgets</h1>

      <MonthNav month={month} onChange={setMonth} shift={shiftMonth} />

      {error && <p className="form-error">{error}</p>}

      {budgetingMode === "available" && cash && (
        <BudgetAllocationSummary income={cash.income} totalCap={totalCap} spent={cash.expense} />
      )}

      {summaries.length === 0 ? (
        <div className="card">
          <p className="empty-state">No expense categories yet — add some in Categories.</p>
        </div>
      ) : (
        <>
          {budgeted.length === 0 ? (
            <div className="card budget-empty-card">
              <p className="empty-state">No budgets set for {monthLabel(month)} yet.</p>
              <button
                type="button"
                className="btn-primary"
                onClick={(e) => setAddBudgetAnchor(e.currentTarget.getBoundingClientRect())}
              >
                Set your first budget
              </button>
            </div>
          ) : (
            <section className="budget-section">
              <h2>Budgeted · {budgeted.length}</h2>
              <motion.div layout className="budget-grid">
                <AnimatePresence>
                  {budgeted.map((s, i) => (
                    <BudgetedCategoryCard
                      key={s.category_id}
                      summary={s}
                      index={i}
                      onSaveCap={handleSaveBudget}
                      onRemove={handleDeleteRequest}
                    />
                  ))}
                  <motion.button
                    key="add-budget"
                    type="button"
                    layout
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: budgeted.length * 0.03 }}
                    className="card budget-card budget-add-card"
                    onClick={(e) => setAddBudgetAnchor(e.currentTarget.getBoundingClientRect())}
                  >
                    <Plus size={22} />
                    <span>Add a budget</span>
                  </motion.button>
                </AnimatePresence>
              </motion.div>
            </section>
          )}

          {notBudgeted.length > 0 && (
            <section className="budget-section">
              <h2>Not budgeted · {notBudgeted.length}</h2>
              <motion.div layout className="budget-chip-row">
                <AnimatePresence>
                  {notBudgeted.map((s) => (
                    <UnbudgetedChip key={s.category_id} summary={s} onSave={handleSaveBudget} />
                  ))}
                </AnimatePresence>
              </motion.div>
            </section>
          )}
        </>
      )}

      {addBudgetAnchor && (
        <AddBudgetPopover
          categories={unbudgetedOptions}
          anchorRect={addBudgetAnchor}
          onSubmit={handleAddBudgetSubmit}
          onClose={() => setAddBudgetAnchor(null)}
        />
      )}

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
