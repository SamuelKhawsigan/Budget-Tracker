import { useEffect, useRef, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { categoryPalette } from "../lib/theme";
import { ColorSwatchPicker } from "./ColorSwatchPicker";
import { IconPicker } from "./IconPicker";

export type CategoryPopoverTarget =
  | { mode: "add-group"; kind: "income" | "expense" }
  | { mode: "add-leaf"; groupId: number; kind: "income" | "expense" }
  | { mode: "edit"; id: number; name: string; color: string | null; icon: string | null };

export interface CategoryPopoverValues {
  name: string;
  color: string | null;
  icon: string | null;
}

interface CategoryEditorPopoverProps {
  target: CategoryPopoverTarget;
  anchorRect: DOMRect;
  siblingNames: string[];
  onSubmit: (values: CategoryPopoverValues) => void | Promise<void>;
  onClose: () => void;
}

const POPOVER_WIDTH = 260;
const MARGIN = 16;

// One popover, reused for adding a group, adding a leaf, and editing either —
// replaces the always-visible color/icon pickers that used to sit inline on
// every add-row. Positioned as a fixed, viewport-clamped overlay anchored to
// whatever trigger opened it (a "..." menu item or a dashed +Add row), rather
// than a relatively-positioned popover, so it can never clip against a card
// near the grid's edge.
export function CategoryEditorPopover({
  target,
  anchorRect,
  siblingNames,
  onSubmit,
  onClose,
}: CategoryEditorPopoverProps) {
  const isEdit = target.mode === "edit";
  const [name, setName] = useState(isEdit ? target.name : "");
  const [color, setColor] = useState<string>(isEdit ? target.color ?? categoryPalette[0] : categoryPalette[0]);
  const [icon, setIcon] = useState<string | null>(isEdit ? target.icon : null);
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
  const top = Math.min(anchorRect.bottom + 8, window.innerHeight - 340);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    if (siblingNames.some((n) => n.toLowerCase() === name.trim().toLowerCase())) {
      setError("A category with this name already exists here");
      return;
    }
    setError(null);
    void Promise.resolve(onSubmit({ name: name.trim(), color, icon }));
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
      <h3 className="category-editor-title">
        {target.mode === "add-group"
          ? `New ${target.kind} group`
          : target.mode === "add-leaf"
            ? `New ${target.kind} category`
            : "Edit"}
      </h3>

      {error && <p className="form-error">{error}</p>}

      <input
        ref={nameRef}
        value={name}
        onChange={(e) => setName(e.currentTarget.value)}
        placeholder={target.mode === "add-group" ? "e.g. Household" : "e.g. Groceries"}
      />

      <ColorSwatchPicker value={color} onChange={setColor} />
      <IconPicker value={icon} onChange={setIcon} />

      <button type="submit" className="btn-primary category-editor-submit">
        {isEdit ? "Save" : "Add"}
      </button>
    </motion.form>
  );
}
