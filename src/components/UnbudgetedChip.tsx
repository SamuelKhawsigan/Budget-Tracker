import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { motion } from "framer-motion";
import type { CategoryBudgetSummary } from "../db/budgets";
import { toMinorUnits } from "../lib/money";
import { CategoryIcon } from "./CategoryIcon";

interface UnbudgetedChipProps {
  summary: CategoryBudgetSummary;
  onSave: (categoryId: number, amount: number) => void | Promise<void>;
}

// Shares a layoutId with BudgetedCategoryCard for the same category so
// Framer Motion can morph this chip into its promoted card instead of a
// plain unmount/mount swap.
export function UnbudgetedChip({ summary, onSave }: UnbudgetedChipProps) {
  const [editing, setEditing] = useState(false);
  const [capText, setCapText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus({ preventScroll: true });
  }, [editing]);

  function handleSave() {
    let amount: number;
    try {
      amount = toMinorUnits(capText || "0");
    } catch {
      setError("Invalid amount");
      return;
    }
    if (amount <= 0) {
      setError("Must be greater than zero");
      return;
    }
    setError(null);
    void onSave(summary.category_id, amount);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") {
      setEditing(false);
      setCapText("");
      setError(null);
    }
  }

  return (
    <motion.div layout layoutId={`budget-cat-${summary.category_id}`} className="budget-chip-wrap">
      {editing ? (
        <div className="budget-chip-editing">
          <input
            ref={inputRef}
            className="figure budget-chip-input"
            value={capText}
            onChange={(e) => setCapText(e.currentTarget.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            placeholder="Set cap"
            inputMode="decimal"
          />
          {error && <span className="form-error budget-chip-error">{error}</span>}
        </div>
      ) : (
        <button type="button" className="budget-chip" onClick={() => setEditing(true)}>
          <CategoryIcon category={{ id: summary.category_id, color: summary.color, icon: summary.icon }} size={14} />
          <span>{summary.category_name}</span>
        </button>
      )}
    </motion.div>
  );
}
