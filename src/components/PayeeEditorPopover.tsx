import { useEffect, useRef, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import type { CategoryOption } from "../db/categories";
import { CategoryPicker } from "./CategoryPicker";

export type PayeePopoverTarget =
  | { mode: "add" }
  | { mode: "edit"; id: number; name: string; defaultCategoryId: number | null };

export interface PayeePopoverValues {
  name: string;
  defaultCategoryId: number | null;
}

interface PayeeEditorPopoverProps {
  target: PayeePopoverTarget;
  anchorRect: DOMRect;
  categories: CategoryOption[];
  existingNames: string[];
  onSubmit: (values: PayeePopoverValues) => void | Promise<void>;
  onClose: () => void;
}

const POPOVER_WIDTH = 260;
const MARGIN = 16;

// Shares the same fixed, viewport-clamped popover pattern as
// CategoryEditorPopover — reused for both adding and editing a payee.
export function PayeeEditorPopover({
  target,
  anchorRect,
  categories,
  existingNames,
  onSubmit,
  onClose,
}: PayeeEditorPopoverProps) {
  const isEdit = target.mode === "edit";
  const [name, setName] = useState(isEdit ? target.name : "");
  const [defaultCategoryId, setDefaultCategoryId] = useState<number | null>(
    isEdit ? target.defaultCategoryId : null,
  );
  const [error, setError] = useState<string | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    nameRef.current?.focus({ preventScroll: true });
  }, []);

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
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    if (existingNames.some((n) => n.toLowerCase() === name.trim().toLowerCase())) {
      setError("A payee with this name already exists");
      return;
    }
    setError(null);
    void Promise.resolve(onSubmit({ name: name.trim(), defaultCategoryId }));
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
      <h3 className="category-editor-title">{isEdit ? "Edit payee" : "New payee"}</h3>

      {error && <p className="form-error">{error}</p>}

      <input
        ref={nameRef}
        value={name}
        onChange={(e) => setName(e.currentTarget.value)}
        placeholder="e.g. Grocery Mart"
      />

      <CategoryPicker
        categories={categories}
        value={defaultCategoryId}
        onChange={setDefaultCategoryId}
        placeholder="No default category"
      />

      <button type="submit" className="btn-primary category-editor-submit">
        {isEdit ? "Save" : "Add"}
      </button>
    </motion.form>
  );
}
