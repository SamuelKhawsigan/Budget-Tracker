import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { motion } from "framer-motion";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { getBudgetHealth, type CategoryBudgetSummary } from "../db/budgets";
import { fromMinorUnits, toMinorUnits } from "../lib/money";
import { useCountUp } from "../lib/useCountUp";
import { getCategoryColor } from "../lib/theme";
import { useTheme } from "../lib/ThemeContext";
import { CategoryIcon } from "./CategoryIcon";
import { RowActionButton } from "./RowActionButton";

interface BudgetedCategoryCardProps {
  summary: CategoryBudgetSummary;
  index: number;
  onSaveCap: (categoryId: number, amount: number) => void | Promise<void>;
  onRemove: (summary: CategoryBudgetSummary) => void;
}

export function BudgetedCategoryCard({ summary, index, onSaveCap, onRemove }: BudgetedCategoryCardProps) {
  const { resolvedTheme } = useTheme();
  const iconColor = getCategoryColor(resolvedTheme, { id: summary.category_id, color: summary.color });
  const cap = summary.cap ?? 0;
  const [editing, setEditing] = useState(false);
  const [capText, setCapText] = useState(fromMinorUnits(cap));
  const [menuOpen, setMenuOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus({ preventScroll: true });
  }, [editing]);

  useEffect(() => {
    if (!menuOpen) return;
    function onDocClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [menuOpen]);

  function startEdit() {
    setCapText(fromMinorUnits(cap));
    setError(null);
    setEditing(true);
  }

  function handleSave() {
    let amount: number;
    try {
      amount = toMinorUnits(capText || "0");
    } catch {
      setError("Invalid amount");
      return;
    }
    setError(null);
    setEditing(false);
    void onSaveCap(summary.category_id, amount);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") {
      setEditing(false);
      setError(null);
    }
  }

  const health = getBudgetHealth(summary.cap, summary.spent);
  const ratio = cap > 0 ? Math.min(summary.spent / cap, 1) : summary.spent > 0 ? 1 : 0;
  const actualRatio = cap > 0 ? summary.spent / cap : summary.spent > 0 ? 1 : 0;
  const remaining = cap - summary.spent;
  const spentDisplay = useCountUp(summary.spent);

  return (
    <motion.div
      layout
      layoutId={`budget-cat-${summary.category_id}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25, delay: index * 0.03 }}
      className={`card budget-card budget-${health}`}
    >
      <div className="budget-card-header">
        <span
          className="budget-card-icon-well"
          style={{ backgroundColor: `color-mix(in srgb, ${iconColor} 16%, transparent)` }}
        >
          <CategoryIcon category={{ id: summary.category_id, color: summary.color, icon: summary.icon }} size={16} />
        </span>
        <div className="budget-card-titles">
          <span className="budget-card-name">{summary.category_name}</span>
          <span className="budget-card-group">{summary.group_name}</span>
        </div>

        <div className="category-card-menu" ref={menuRef}>
          <RowActionButton icon={MoreHorizontal} label="Budget options" onClick={() => setMenuOpen((o) => !o)} />
          {menuOpen && (
            <div className="category-card-menu-popover">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  startEdit();
                }}
              >
                <Pencil size={14} /> Edit cap
              </button>
              <button
                type="button"
                className="danger"
                onClick={() => {
                  setMenuOpen(false);
                  onRemove(summary);
                }}
              >
                <Trash2 size={14} /> Remove budget
              </button>
            </div>
          )}
        </div>
      </div>

      {editing ? (
        <div className="budget-card-cap-edit">
          <input
            ref={inputRef}
            className="figure"
            value={capText}
            onChange={(e) => setCapText(e.currentTarget.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            placeholder="0.00"
            inputMode="decimal"
          />
          {error && <span className="form-error budget-card-cap-error">{error}</span>}
        </div>
      ) : (
        <button type="button" className="budget-card-figure-btn" onClick={startEdit}>
          <span className="figure budget-card-spent">{fromMinorUnits(Math.round(spentDisplay))}</span>
          <span className="budget-card-of">of {fromMinorUnits(cap)}</span>
        </button>
      )}

      <div className="budget-card-meter">
        <motion.div
          className={`budget-card-meter-fill budget-${health}`}
          initial={{ width: 0 }}
          animate={{ width: `${ratio * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      <div className="budget-card-footer">
        <span>{Math.round(actualRatio * 100)}% used</span>
        <span className={remaining < 0 ? "negative" : undefined}>
          {remaining < 0 ? `${fromMinorUnits(-remaining)} over` : `${fromMinorUnits(remaining)} left`}
        </span>
      </div>
    </motion.div>
  );
}
