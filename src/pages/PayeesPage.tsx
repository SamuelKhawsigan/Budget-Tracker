import { useCallback, useEffect, useMemo, useState } from "react";
import type Database from "@tauri-apps/plugin-sql";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import {
  createPayee,
  deletePayee,
  getPayeeDependencyInfo,
  getPayeeStats,
  listAllPayees,
  setPayeeArchived,
  setPayeeDefaultCategory,
  updatePayee,
  type PayeeStats,
} from "../db/payees";
import { listLeafCategories, type CategoryOption } from "../db/categories";
import type { Payee } from "../types";
import { PayeeTile } from "../components/PayeeTile";
import {
  PayeeEditorPopover,
  type PayeePopoverTarget,
  type PayeePopoverValues,
} from "../components/PayeeEditorPopover";
import { PayeeBulkAssignModal } from "../components/PayeeBulkAssignModal";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { useDeleteFlow } from "../lib/useDeleteFlow";

interface PayeesPageProps {
  db: Database;
  onSelectPayee: (id: number) => void;
}

type SortMode = "name" | "most-used" | "recent";

export function PayeesPage({ db, onSelectPayee }: PayeesPageProps) {
  const [payees, setPayees] = useState<Payee[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [stats, setStats] = useState<Map<number, PayeeStats>>(new Map());
  const [showArchived, setShowArchived] = useState(false);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortMode>("name");
  const [popover, setPopover] = useState<{ target: PayeePopoverTarget; anchorRect: DOMRect } | null>(null);
  const [bulkAssignOpen, setBulkAssignOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const del = useDeleteFlow(setError);

  const refresh = useCallback(async () => {
    const [list, statsMap] = await Promise.all([listAllPayees(db, showArchived), getPayeeStats(db)]);
    setPayees(list);
    setStats(statsMap);
  }, [db, showArchived]);

  useEffect(() => {
    void refresh();
    void listLeafCategories(db).then(setCategories);
  }, [db, refresh]);

  const visiblePayees = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = query ? payees.filter((p) => p.name.toLowerCase().includes(query)) : payees;

    const sorted = [...filtered];
    if (sort === "name") {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort === "most-used") {
      sorted.sort((a, b) => (stats.get(b.id)?.count ?? 0) - (stats.get(a.id)?.count ?? 0));
    } else {
      sorted.sort((a, b) => (stats.get(b.id)?.lastUsed ?? "").localeCompare(stats.get(a.id)?.lastUsed ?? ""));
    }
    return sorted;
  }, [payees, search, sort, stats]);

  const needsCategory = useMemo(
    () => payees.filter((p) => !p.is_archived && p.default_category_id == null),
    [payees],
  );

  function closePopover() {
    setPopover(null);
  }

  function openPopover(target: PayeePopoverTarget, anchorRect: DOMRect) {
    setPopover({ target, anchorRect });
  }

  async function handlePopoverSubmit(values: PayeePopoverValues) {
    if (!popover) return;
    setError(null);
    try {
      const { target } = popover;
      if (target.mode === "add") {
        await createPayee(db, { name: values.name, defaultCategoryId: values.defaultCategoryId });
      } else {
        await updatePayee(db, target.id, { name: values.name, defaultCategoryId: values.defaultCategoryId });
      }
      closePopover();
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function handleSetDefaultCategory(id: number, categoryId: number | null) {
    setError(null);
    try {
      await setPayeeDefaultCategory(db, id, categoryId);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function handleArchiveToggle(id: number, archived: boolean) {
    await setPayeeArchived(db, id, archived);
    await refresh();
  }

  async function handleDeleteRequest(id: number) {
    const payee = payees.find((p) => p.id === id);
    if (!payee) return;
    setError(null);
    const info = await getPayeeDependencyInfo(db, id);
    del.request({
      title: "Delete payee",
      confirmLabel: "Delete payee",
      message:
        info.transactionCount > 0 ? (
          <>
            Delete <strong>{payee.name}</strong>? Its {info.transactionCount} transaction
            {info.transactionCount === 1 ? "" : "s"} will be kept but lose this payee.
          </>
        ) : (
          <>
            Delete <strong>{payee.name}</strong>?
          </>
        ),
      run: async () => {
        await deletePayee(db, id);
        await refresh();
      },
    });
  }

  return (
    <>
      <div className="page-header-row payee-page-header">
        <h1>Payees</h1>
        <input
          className="payee-search"
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          placeholder="Search payees…"
        />
        <select value={sort} onChange={(e) => setSort(e.currentTarget.value as SortMode)}>
          <option value="name">Name</option>
          <option value="most-used">Most used</option>
          <option value="recent">Recently used</option>
        </select>
        <label className="show-archived">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.currentTarget.checked)}
          />
          Show archived
        </label>
      </div>

      {error && <p className="form-error">{error}</p>}

      {needsCategory.length > 0 && (
        <div className="payee-nudge-banner">
          <span>
            {needsCategory.length} payee{needsCategory.length === 1 ? "" : "s"} have no default category.
          </span>
          <button type="button" className="btn-primary" onClick={() => setBulkAssignOpen(true)}>
            Assign now
          </button>
        </div>
      )}

      {payees.length === 0 ? (
        <div className="card">
          <p className="empty-state">No payees yet — they're created automatically as you add transactions.</p>
        </div>
      ) : (
        <motion.div layout className="payee-grid">
          <AnimatePresence>
            {visiblePayees.map((payee, i) => (
              <PayeeTile
                key={payee.id}
                payee={payee}
                categories={categories}
                stats={stats.get(payee.id)}
                index={i}
                onView={onSelectPayee}
                onOpenPopover={openPopover}
                onArchiveToggle={handleArchiveToggle}
                onDelete={handleDeleteRequest}
                onSetDefaultCategory={handleSetDefaultCategory}
              />
            ))}
            <motion.button
              key="add-payee"
              type="button"
              layout
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: visiblePayees.length * 0.03 }}
              className="card payee-tile payee-add-tile"
              onClick={(e) => openPopover({ mode: "add" }, e.currentTarget.getBoundingClientRect())}
            >
              <Plus size={22} />
              <span>Add payee</span>
            </motion.button>
          </AnimatePresence>
        </motion.div>
      )}

      {popover && (
        <PayeeEditorPopover
          target={popover.target}
          anchorRect={popover.anchorRect}
          categories={categories}
          onSubmit={handlePopoverSubmit}
          onClose={closePopover}
        />
      )}

      {bulkAssignOpen && (
        <PayeeBulkAssignModal
          payees={needsCategory}
          categories={categories}
          onAssign={handleSetDefaultCategory}
          onClose={() => {
            setBulkAssignOpen(false);
            void refresh();
          }}
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
