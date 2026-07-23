import { useCallback, useEffect, useMemo, useState } from "react";
import type Database from "@tauri-apps/plugin-sql";
import { ArchiveRestore, Archive as ArchiveIcon, Pencil, Trash2 } from "lucide-react";
import {
  createCategoryGroup,
  createLeafCategory,
  deleteCategoryCascade,
  getCategoryDependencyInfo,
  listCategories,
  setCategoryArchived,
  updateCategory,
  type CategoryGroupInput,
  type CategoryLeafInput,
} from "../db/categories";
import type { Category } from "../types";
import { CategoryGroupForm } from "../components/CategoryGroupForm";
import { CategoryEditForm } from "../components/CategoryEditForm";
import { CategoryLeafQuickAdd } from "../components/CategoryLeafQuickAdd";
import { CategoryRow } from "../components/CategoryRow";
import { CategoryIcon } from "../components/CategoryIcon";
import { RowActionButton } from "../components/RowActionButton";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { useDeleteFlow } from "../lib/useDeleteFlow";

interface CategoriesPageProps {
  db: Database;
}

const KINDS = ["income", "expense"] as const;

export function CategoriesPage({ db }: CategoriesPageProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const del = useDeleteFlow(setError);

  const refresh = useCallback(async () => {
    setCategories(await listCategories(db, showArchived));
  }, [db, showArchived]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const groups = useMemo(() => categories.filter((c) => c.parent_id == null), [categories]);
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

  const editingCategory = editingId != null ? categories.find((c) => c.id === editingId) ?? null : null;

  async function handleAddGroup(values: CategoryGroupInput) {
    setError(null);
    try {
      await createCategoryGroup(db, values);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function handleAddLeaf(input: CategoryLeafInput) {
    setError(null);
    try {
      await createLeafCategory(db, input);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function handleSaveEdit(values: { name: string; color: string | null; icon: string | null }) {
    if (editingId == null) return;
    setError(null);
    try {
      await updateCategory(db, editingId, values);
      setEditingId(null);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function handleArchiveToggle(id: number, archived: boolean) {
    await setCategoryArchived(db, id, archived);
    if (editingId === id) setEditingId(null);
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
        if (editingId === id) setEditingId(null);
        await refresh();
      },
    });
  }

  return (
    <>
      <h1>Categories</h1>

      {error && <p className="form-error">{error}</p>}

      {editingCategory ? (
        <CategoryEditForm
          key={editingCategory.id}
          initial={{ name: editingCategory.name, color: editingCategory.color, icon: editingCategory.icon }}
          onSubmit={handleSaveEdit}
          onCancel={() => setEditingId(null)}
        />
      ) : (
        <CategoryGroupForm onSubmit={handleAddGroup} />
      )}

      <label className="show-archived">
        <input
          type="checkbox"
          checked={showArchived}
          onChange={(e) => setShowArchived(e.currentTarget.checked)}
        />
        Show archived categories
      </label>

      {KINDS.map((kind) => (
        <section key={kind} className="category-section">
          <h2>{kind === "income" ? "Income" : "Expense"}</h2>
          <ul className="category-list">
            {groups
              .filter((g) => g.kind === kind)
              .map((group) => (
                <li
                  key={group.id}
                  className={"category-group-block" + (group.is_archived ? " archived" : "")}
                >
                  <div className="category-row">
                    <CategoryIcon category={group} size={16} />
                    <span className="category-name">{group.name}</span>
                    <span className="category-row-actions">
                      <RowActionButton icon={Pencil} label="Edit" onClick={() => setEditingId(group.id)} />
                      <RowActionButton
                        icon={group.is_archived ? ArchiveRestore : ArchiveIcon}
                        label={group.is_archived ? "Unarchive" : "Archive"}
                        onClick={() => handleArchiveToggle(group.id, !group.is_archived)}
                      />
                      <RowActionButton
                        icon={Trash2}
                        label="Delete"
                        danger
                        onClick={() => handleDeleteRequest(group.id)}
                      />
                    </span>
                  </div>
                  <ul className="category-leaves">
                    {(leavesByGroup.get(group.id) ?? []).map((leaf) => (
                      <CategoryRow
                        key={leaf.id}
                        category={leaf}
                        indent
                        onEdit={() => setEditingId(leaf.id)}
                        onArchiveToggle={() => handleArchiveToggle(leaf.id, !leaf.is_archived)}
                        onDelete={() => handleDeleteRequest(leaf.id)}
                      />
                    ))}
                    <li className="category-leaf">
                      <CategoryLeafQuickAdd groupId={group.id} kind={kind} onSubmit={handleAddLeaf} />
                    </li>
                  </ul>
                </li>
              ))}
          </ul>
        </section>
      ))}

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
