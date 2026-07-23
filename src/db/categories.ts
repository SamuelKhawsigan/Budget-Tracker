import type Database from "@tauri-apps/plugin-sql";
import type { Category } from "../types";

// Transactions are categorized against leaf categories only (a leaf points at
// its group via parent_id). Used by the transaction quick-add dropdown.
export interface CategoryOption {
  id: number;
  name: string;
  kind: "income" | "expense";
  group_name: string;
  color: string | null;
  icon: string | null;
}

export async function listLeafCategories(db: Database): Promise<CategoryOption[]> {
  return db.select<CategoryOption[]>(
    `SELECT c.id as id, c.name as name, c.kind as kind, p.name as group_name,
            c.color as color, c.icon as icon
     FROM categories c
     JOIN categories p ON p.id = c.parent_id
     WHERE c.is_archived = 0 AND p.is_archived = 0
     ORDER BY p.sort_order, c.sort_order`,
  );
}

// Full set (groups and leaves, parent_id NULL vs set) for the management page.
export async function listCategories(db: Database, includeArchived = false): Promise<Category[]> {
  return db.select<Category[]>(
    includeArchived
      ? "SELECT * FROM categories ORDER BY sort_order, id"
      : "SELECT * FROM categories WHERE is_archived = 0 ORDER BY sort_order, id",
  );
}

export interface CategoryGroupInput {
  name: string;
  kind: "income" | "expense";
  color: string | null;
  icon: string | null;
}

export async function createCategoryGroup(db: Database, input: CategoryGroupInput): Promise<number> {
  const result = await db.execute(
    "INSERT INTO categories (name, parent_id, kind, color, icon) VALUES (?, NULL, ?, ?, ?)",
    [input.name, input.kind, input.color, input.icon],
  );
  if (result.lastInsertId == null) {
    throw new Error("Insert did not return a row id");
  }
  return result.lastInsertId;
}

export interface CategoryLeafInput {
  name: string;
  parentId: number;
  kind: "income" | "expense";
  color: string | null;
  icon: string | null;
}

export async function createLeafCategory(db: Database, input: CategoryLeafInput): Promise<number> {
  const result = await db.execute(
    "INSERT INTO categories (name, parent_id, kind, color, icon) VALUES (?, ?, ?, ?, ?)",
    [input.name, input.parentId, input.kind, input.color, input.icon],
  );
  if (result.lastInsertId == null) {
    throw new Error("Insert did not return a row id");
  }
  return result.lastInsertId;
}

export interface CategoryUpdateInput {
  name: string;
  color: string | null;
  icon: string | null;
}

// Applies to a group or a leaf alike (both are rows in the same table with
// the same color/icon columns). kind and parent_id are fixed at creation.
export async function updateCategory(db: Database, id: number, input: CategoryUpdateInput): Promise<void> {
  await db.execute("UPDATE categories SET name = ?, color = ?, icon = ? WHERE id = ?", [
    input.name,
    input.color,
    input.icon,
    id,
  ]);
}

export async function setCategoryArchived(db: Database, id: number, archived: boolean): Promise<void> {
  await db.execute("UPDATE categories SET is_archived = ? WHERE id = ?", [archived ? 1 : 0, id]);
}

export interface CategoryDependencyInfo {
  isGroup: boolean;
  leafCount: number;
  transactionCount: number; // transactions referencing this category or its leaves
}

// A group carries its leaves; both a group's leaves and a bare leaf can be
// referenced by transactions. This reports the full blast radius for the
// confirmation dialog.
export async function getCategoryDependencyInfo(
  db: Database,
  id: number,
): Promise<CategoryDependencyInfo> {
  const self = await db.select<{ parent_id: number | null }[]>(
    "SELECT parent_id FROM categories WHERE id = ?",
    [id],
  );
  const isGroup = self.length > 0 && self[0].parent_id == null;
  const leaves = isGroup
    ? await db.select<{ id: number }[]>("SELECT id FROM categories WHERE parent_id = ?", [id])
    : [];
  const ids = [id, ...leaves.map((l) => l.id)];
  const ph = ids.map(() => "?").join(",");
  const txn = await db.select<{ n: number }[]>(
    `SELECT COUNT(*) as n FROM transactions WHERE category_id IN (${ph})`,
    ids,
  );
  return { isGroup, leafCount: leaves.length, transactionCount: txn[0]?.n ?? 0 };
}

// Reassigns dependents rather than blocking: transactions using this category
// (or its leaves) fall back to Uncategorized (category_id NULL), payee defaults
// pointing at it are cleared, its budgets are dropped, then the category (and
// a group's leaves) are deleted.
export async function deleteCategoryCascade(db: Database, id: number): Promise<void> {
  const self = await db.select<{ parent_id: number | null }[]>(
    "SELECT parent_id FROM categories WHERE id = ?",
    [id],
  );
  if (self.length === 0) return;
  const isGroup = self[0].parent_id == null;
  const leaves = isGroup
    ? await db.select<{ id: number }[]>("SELECT id FROM categories WHERE parent_id = ?", [id])
    : [];
  const ids = [id, ...leaves.map((l) => l.id)];
  const ph = ids.map(() => "?").join(",");

  await db.execute(`UPDATE transactions SET category_id = NULL WHERE category_id IN (${ph})`, ids);
  await db.execute(`UPDATE payees SET default_category_id = NULL WHERE default_category_id IN (${ph})`, ids);
  await db.execute(`DELETE FROM budgets WHERE category_id IN (${ph})`, ids);

  // Leaves first (parent_id FK), then the group / bare leaf itself.
  if (leaves.length > 0) {
    const lph = leaves.map(() => "?").join(",");
    await db.execute(
      `DELETE FROM categories WHERE id IN (${lph})`,
      leaves.map((l) => l.id),
    );
  }
  await db.execute("DELETE FROM categories WHERE id = ?", [id]);
}
