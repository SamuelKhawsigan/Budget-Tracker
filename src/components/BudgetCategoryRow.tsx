import { useState } from "react";
import { Trash2 } from "lucide-react";
import { fromMinorUnits, toMinorUnits } from "../lib/money";
import { getBudgetHealth, type CategoryBudgetSummary } from "../db/budgets";
import { RowActionButton } from "./RowActionButton";
import { CategoryIcon } from "./CategoryIcon";

interface BudgetCategoryRowProps {
  summary: CategoryBudgetSummary;
  onSave: (categoryId: number, amount: number) => void | Promise<void>;
  onDelete: (summary: CategoryBudgetSummary) => void;
}

export function BudgetCategoryRow({ summary, onSave, onDelete }: BudgetCategoryRowProps) {
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
    <li className={`budget-row budget-${getBudgetHealth(summary.cap, summary.spent)}`}>
      <span className="budget-tick" />
      <span className="budget-name">
        <CategoryIcon category={{ id: summary.category_id, color: summary.color, icon: summary.icon }} size={15} />
        <span className="budget-name-text">
          {summary.group_name} / {summary.category_name}
        </span>
      </span>
      <div className="budget-cap-cell">
        <input
          className="figure"
          value={capText}
          onChange={(e) => {
            setCapText(e.currentTarget.value);
            setDirty(true);
          }}
          placeholder="0.00"
          inputMode="decimal"
          aria-label={`Budget cap for ${summary.category_name}`}
        />
        {dirty && (
          <button type="button" className="btn-primary budget-save" onClick={handleSave}>
            Save
          </button>
        )}
      </div>
      <span className="budget-num figure">{fromMinorUnits(summary.spent)}</span>
      <span className={"budget-num figure" + (remaining != null && remaining < 0 ? " negative" : "")}>
        {remaining != null ? fromMinorUnits(remaining) : "—"}
      </span>
      <span className="budget-row-action">
        {summary.cap != null && (
          <RowActionButton icon={Trash2} label="Remove budget" danger onClick={() => onDelete(summary)} />
        )}
      </span>
      {error && <span className="budget-error form-error">{error}</span>}
    </li>
  );
}
