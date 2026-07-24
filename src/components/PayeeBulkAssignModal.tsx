import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Payee } from "../types";
import type { CategoryOption } from "../db/categories";
import { CategoryPicker } from "./CategoryPicker";

interface PayeeBulkAssignModalProps {
  payees: Payee[];
  categories: CategoryOption[];
  onAssign: (payeeId: number, categoryId: number) => void | Promise<void>;
  onClose: () => void;
}

// The nudge banner's action — assign several payees' default categories in
// one sitting instead of opening each one's own edit popover individually.
export function PayeeBulkAssignModal({ payees, categories, onAssign, onClose }: PayeeBulkAssignModalProps) {
  const [doneIds, setDoneIds] = useState<Set<number>>(new Set());
  const remaining = payees.filter((p) => !doneIds.has(p.id));

  async function handleAssign(payeeId: number, categoryId: number | null) {
    if (categoryId == null) return;
    await onAssign(payeeId, categoryId);
    setDoneIds((prev) => new Set(prev).add(payeeId));
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card bulk-assign-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Assign default categories</h2>
        <p className="modal-message">
          Pick a default category for each payee below — it fills in automatically on future imports and
          quick-adds.
        </p>

        {remaining.length === 0 ? (
          <p className="empty-state">All set — every payee has a default category now.</p>
        ) : (
          <ul className="entity-list bulk-assign-list">
            <AnimatePresence>
              {remaining.map((p) => (
                <motion.li
                  layout
                  key={p.id}
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="entity-row bulk-assign-row"
                >
                  <span className="entity-row-title bulk-assign-name">{p.name}</span>
                  <CategoryPicker
                    categories={categories}
                    value={null}
                    onChange={(id) => void handleAssign(p.id, id)}
                    placeholder="Choose category"
                  />
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}

        <div className="modal-actions">
          <button type="button" className="btn-primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
