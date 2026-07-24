import { motion } from "framer-motion";
import { Archive as ArchiveIcon, ArchiveRestore, Pencil, Trash2 } from "lucide-react";
import type { Payee } from "../types";
import type { CategoryOption } from "../db/categories";
import type { PayeeStats } from "../db/payees";
import { fromMinorUnits } from "../lib/money";
import { getCategoryColor } from "../lib/theme";
import { useTheme } from "../lib/ThemeContext";
import { CategoryPicker } from "./CategoryPicker";
import { RowActionButton } from "./RowActionButton";
import type { PayeePopoverTarget } from "./PayeeEditorPopover";

interface PayeeTileProps {
  payee: Payee;
  categories: CategoryOption[];
  stats: PayeeStats | undefined;
  index: number;
  onView: (id: number) => void;
  onOpenPopover: (target: PayeePopoverTarget, anchorRect: DOMRect) => void;
  onArchiveToggle: (id: number, archived: boolean) => void;
  onDelete: (id: number) => void;
  onSetDefaultCategory: (id: number, categoryId: number | null) => void;
}

export function PayeeTile({
  payee,
  categories,
  stats,
  index,
  onView,
  onOpenPopover,
  onArchiveToggle,
  onDelete,
  onSetDefaultCategory,
}: PayeeTileProps) {
  const { resolvedTheme } = useTheme();
  const defaultCategory =
    payee.default_category_id != null ? categories.find((c) => c.id === payee.default_category_id) ?? null : null;
  const avatarColor = defaultCategory ? getCategoryColor(resolvedTheme, defaultCategory) : null;
  const initial = payee.name.trim().charAt(0).toUpperCase() || "?";

  const total = stats?.total ?? 0;
  const totalClass = total > 0 ? "positive" : total < 0 ? "negative" : "";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25, delay: index * 0.03 }}
      whileHover={{ y: -3 }}
      className={"card payee-tile" + (payee.is_archived ? " archived" : "")}
    >
      <div className="payee-tile-actions">
        <motion.span whileTap={{ scale: 0.85 }}>
          <RowActionButton
            icon={Pencil}
            label="Edit"
            onClick={(e) =>
              onOpenPopover(
                { mode: "edit", id: payee.id, name: payee.name, defaultCategoryId: payee.default_category_id },
                e.currentTarget.getBoundingClientRect(),
              )
            }
          />
        </motion.span>
        <motion.span whileTap={{ scale: 0.85 }}>
          <RowActionButton
            icon={payee.is_archived ? ArchiveRestore : ArchiveIcon}
            label={payee.is_archived ? "Unarchive" : "Archive"}
            onClick={() => onArchiveToggle(payee.id, !payee.is_archived)}
          />
        </motion.span>
        <motion.span whileTap={{ scale: 0.85 }}>
          <RowActionButton icon={Trash2} label="Delete" danger onClick={() => onDelete(payee.id)} />
        </motion.span>
      </div>

      <button type="button" className="payee-tile-body" onClick={() => onView(payee.id)}>
        <span
          className="payee-avatar"
          style={{
            backgroundColor: avatarColor ? `color-mix(in srgb, ${avatarColor} 18%, transparent)` : "var(--surface-alt)",
            color: avatarColor ?? "var(--text-muted)",
          }}
        >
          {initial}
        </span>
        <span className="payee-tile-name">{payee.name}</span>
        <span className="figure payee-tile-lastused">{stats?.lastUsed ?? "Never used"}</span>
      </button>

      <div className={"payee-tile-category" + (payee.default_category_id == null ? " unset" : "")}>
        <CategoryPicker
          categories={categories}
          value={payee.default_category_id}
          onChange={(id) => onSetDefaultCategory(payee.id, id)}
          placeholder="+ Set category"
        />
      </div>

      <div className="payee-tile-footer">
        <span className="payee-tile-count">
          {stats?.count ?? 0} txn{stats?.count === 1 ? "" : "s"}
        </span>
        <span className={"figure payee-tile-total" + (totalClass ? " " + totalClass : "")}>
          {fromMinorUnits(total)}
        </span>
      </div>
    </motion.div>
  );
}
