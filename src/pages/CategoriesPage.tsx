import { useCallback, useEffect, useMemo, useState } from "react";
import type Database from "@tauri-apps/plugin-sql";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import {
  createCategoryGroup,
  createLeafCategory,
  deleteCategoryCascade,
  getCategoryActivity,
  getCategoryDependencyInfo,
  listCategories,
  setCategoryArchived,
  updateCategory,
} from "../db/categories";
import type { Category } from "../types";
import { currentMonth } from "../lib/month";
import { CategoryGroupCard } from "../components/CategoryGroupCard";
import {
  CategoryEditorPopover,
  type CategoryPopoverTarget,
  type CategoryPopoverValues,
} from "../components/CategoryEditorPopover";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { useDeleteFlow } from "../lib/useDeleteFlow";

interface CategoriesPageProps {
  db: Database;
}

export function CategoriesPage({ db }: CategoriesPageProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [activity, setActivity] = useState<Map<number, number>>(new Map());
  const [showArchived, setShowArchived] = useState(false);
  const [popover, setPopover] = useState<{ target: CategoryPopoverTarget; anchorRect: DOMRect } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const del = useDeleteFlow(setError);

  const refresh = useCallback(async () => {
    setCategories(await listCategories(db, showArchived));
  }, [db, showArchived]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    void getCategoryActivity(db, currentMonth()).then(setActivity);
  }, [db, categories]);

  const expenseGroups = useMemo(
    () => categories.filter((c) => c.parent_id == null && c.kind === "expense"),
    [categories],
  );
  const incomeGroups = useMemo(
    () => categories.filter((c) => c.parent_id == null && c.kind === "income"),
    [categories],
  );

  const leavesByGroup = useMemo(() => {
    const map = new Map<number, Category[]>();
    for (const c of categories) {
      if (c.parent_id != null) {
        const list = map.get(c.parent_id) ?? [];
        list.push(c);
        map.set(c.parent_id, list);
      }
    }
    return map;
  }, [categories]);

  function closePopover() {
    setPopover(null);
  }

  function openPopover(target: CategoryPopoverTarget, anchorRect: DOMRect) {
    setPopover({ target, anchorRect });
  }

  async function handlePopoverSubmit(values: CategoryPopoverValues) {
    if (!popover) return;
    setError(null);
    try {
      const { target } = popover;
      if (target.mode === "add-group") {
        await createCategoryGroup(db, {
          name: values.name,
          kind: target.kind,
          color: values.color,
          icon: values.icon,
        });
      } else if (target.mode === "add-leaf") {
        await createLeafCategory(db, {
          name: values.name,
          parentId: target.groupId,
          kind: target.kind,
          color: values.color,
          icon: values.icon,
        });
      } else {
        await updateCategory(db, target.id, { name: values.name, color: values.color, icon: values.icon });
      }
      closePopover();
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function handleArchiveToggle(id: number, archived: boolean) {
    await setCategoryArchived(db, id, archived);
    await refresh();
  }

  async function handleDeleteRequest(id: number) {
    const category = categories.find((c) => c.id === id);
    if (!category) return;
    setError(null);
    const info = await getCategoryDependencyInfo(db, id);
    const reassign =
      info.transactionCount > 0 ? (
        <>
          {" "}
          Its {info.transactionCount} transaction{info.transactionCount === 1 ? "" : "s"} will move to
          Uncategorized.
        </>
      ) : null;
    del.request({
      title: info.isGroup ? "Delete category group" : "Delete category",
      confirmLabel: "Delete",
      message: info.isGroup ? (
        <>
          Delete <strong>{category.name}</strong>
          {info.leafCount > 0
            ? ` and its ${info.leafCount} subcategor${info.leafCount === 1 ? "y" : "ies"}`
            : ""}
          ?{reassign}
        </>
      ) : (
        <>
          Delete <strong>{category.name}</strong>?{reassign}
        </>
      ),
      run: async () => {
        await deleteCategoryCascade(db, id);
        await refresh();
      },
    });
  }

  function renderSection(sectionKind: "expense" | "income", label: string, groups: Category[]) {
    return (
      <section className={"category-kind-section " + sectionKind}>
        <h2 className="category-kind-heading">
          <span className={"category-kind-dot " + sectionKind} />
          {label}
        </h2>
        <motion.div layout className="category-group-grid">
          <AnimatePresence>
            {groups.map((group, i) => (
              <CategoryGroupCard
                key={group.id}
                group={group}
                leaves={leavesByGroup.get(group.id) ?? []}
                activity={activity}
                index={i}
                onOpenPopover={openPopover}
                onArchiveToggle={handleArchiveToggle}
                onDeleteRequest={handleDeleteRequest}
              />
            ))}
            <motion.button
              key={`new-group-${sectionKind}`}
              type="button"
              layout
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: groups.length * 0.03 }}
              className="card category-group-card category-new-group-card"
              onClick={(e) =>
                openPopover({ mode: "add-group", kind: sectionKind }, e.currentTarget.getBoundingClientRect())
              }
            >
              <Plus size={22} />
              <span>New group</span>
            </motion.button>
          </AnimatePresence>
        </motion.div>
      </section>
    );
  }

  return (
    <>
      <div className="page-header-row category-page-header">
        <h1>Categories</h1>
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

      {renderSection("expense", "Expense", expenseGroups)}
      {renderSection("income", "Income", incomeGroups)}

      {popover && (
        <CategoryEditorPopover
          target={popover.target}
          anchorRect={popover.anchorRect}
          onSubmit={handlePopoverSubmit}
          onClose={closePopover}
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
