import { useEffect, useRef, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import type { CategoryOption } from "../db/categories";
import { toMinorUnits } from "../lib/money";
import { CategoryPicker } from "./CategoryPicker";

interface AddBudgetPopoverProps {
  categories: CategoryOption[]; // pre-filtered to expense categories without a cap this month
  anchorRect: DOMRect;
  onSubmit: (categoryId: number, amount: number) => void | Promise<void>;
  onClose: () => void;
}

const POPOVER_WIDTH = 260;
const MARGIN = 16;

export function AddBudgetPopover({ categories, anchorRect, onSubmit, onClose }: AddBudgetPopoverProps) {
  const [categoryId, setCategoryId] = useState<number | null>(categories[0]?.id ?? null);
  const [capText, setCapText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const left = Math.min(Math.max(anchorRect.left, MARGIN), window.innerWidth - POPOVER_WIDTH - MARGIN);
  const top = Math.min(anchorRect.bottom + 8, window.innerHeight - 300);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (categoryId == null) {
      setError("Choose a category");
      return;
    }
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
    void Promise.resolve(onSubmit(categoryId, amount));
  }

  return (
    <motion.form
      ref={ref}
      onSubmit={handleSubmit}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className="category-editor-popover"
      style={{ position: "fixed", left, top, width: POPOVER_WIDTH }}
    >
      <h3 className="category-editor-title">Add a budget</h3>

      {error && <p className="form-error">{error}</p>}

      {categories.length === 0 ? (
        <p className="empty-state">Every expense category already has a budget this month.</p>
      ) : (
        <>
          <CategoryPicker
            categories={categories}
            value={categoryId}
            onChange={setCategoryId}
            placeholder="Choose category"
          />
          <input
            className="figure"
            value={capText}
            onChange={(e) => setCapText(e.currentTarget.value)}
            placeholder="0.00"
            inputMode="decimal"
          />
          <button type="submit" className="btn-primary category-editor-submit">
            Add
          </button>
        </>
      )}
    </motion.form>
  );
}
