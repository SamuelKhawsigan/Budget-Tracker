import type Database from "@tauri-apps/plugin-sql";
import type { Category } from "../types";

// Transactions are categorized against leaf categories only (a leaf points at
// its group via parent_id). Used by the transaction quick-add dropdown.
export interface CategoryOption {
  id: number;
  name: string;
  kind: "income" | "expense";
  group_name: string;
}

export async function listLeafCategories(db: Database): Promise<CategoryOption[]> {
  return db.select<CategoryOption[]>(
    `SELECT c.id as id, c.name as name, c.kind as kind, p.name as group_name
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
}

export async function createCategoryGroup(db: Database, input: CategoryGroupInput): Promise<number> {
  const result = await db.execute("INSERT INTO categories (name, parent_id, kind) VALUES (?, NULL, ?)", [
    input.name,
    input.kind,
  ]);
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
