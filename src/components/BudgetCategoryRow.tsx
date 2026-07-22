import { useState } from "react";
import { fromMinorUnits, toMinorUnits } from "../lib/money";
import type { CategoryBudgetSummary } from "../db/budgets";

interface BudgetCategoryRowProps {
  summary: CategoryBudgetSummary;
  onSave: (categoryId: number, amount: number) => void | Promise<void>;
}

function healthClass(cap: number | null, spent: number): string {
  if (cap == null || cap <= 0) return spent > 0 ? "budget-over" : "budget-none";
  const ratio = spent / cap;
  if (ratio > 1) return "budget-over";
  if (ratio >= 0.8) return "budget-warn";
  return "budget-good";
}

export function BudgetCategoryRow({ summary, onSave }: BudgetCategoryRowProps) {
  const [capText, setCapText] = useState(summary.cap != null ? fromMinorUnits(summary.cap) : "");
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSave() {
    let amount: number;
    try {
      amount = toMinorUnits(capText || "0");
    } catch {
      setError("Invalid amount");
      return;
    }
    setError(null);
    setDirty(false);
    void onSave(summary.category_id, amount);
  }

  const remaining = summary.cap != null ? summary.cap - summary.spent : null;

  return (
    <tr className={healthClass(summary.cap, summary.spent)}>
      <td>
        {summary.group_name} / {summary.category_name}
      </td>
      <td className="budget-cap-cell">
        <input
          value={capText}
          onChange={(e) => {
            setCapText(e.currentTarget.value);
            setDirty(true);
          }}
          placeholder="0.00"
          inputMode="decimal"
        />
        {dirty && (
          <button type="button" onClick={handleSave}>
            Save
          </button>
        )}
        {error && <span className="form-error">{error}</span>}
      </td>
      <td>{fromMinorUnits(summary.spent)}</td>
      <td className={remaining != null && remaining < 0 ? "negative" : undefined}>
        {remaining != null ? fromMinorUnits(remaining) : "—"}
      </td>
    </tr>
  );
}
