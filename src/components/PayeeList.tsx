import { ArchiveRestore, Archive as ArchiveIcon, Pencil, Trash2 } from "lucide-react";
import type { Payee } from "../types";
import type { CategoryOption } from "../db/categories";
import { RowActionButton } from "./RowActionButton";

interface PayeeListProps {
  payees: Payee[];
  categories: CategoryOption[];
  onEdit: (id: number) => void;
  onArchiveToggle: (id: number, archived: boolean) => void;
  onDelete: (id: number) => void;
}

export function PayeeList({ payees, categories, onEdit, onArchiveToggle, onDelete }: PayeeListProps) {
  if (payees.length === 0) {
    return <p className="empty-state">No payees yet.</p>;
  }

  function categoryLabel(id: number | null): string {
    if (id == null) return "—";
    const category = categories.find((c) => c.id === id);
    return category ? `${category.group_name} / ${category.name}` : "—";
  }

  return (
    <ul className="entity-list">
      {payees.map((payee) => (
        <li key={payee.id} className={"entity-row" + (payee.is_archived ? " archived" : "")}>
          <div className="entity-row-main">
            <span className="entity-row-title">{payee.name}</span>
            <span className="entity-row-meta">{categoryLabel(payee.default_category_id)}</span>
          </div>
          <div className="entity-row-actions">
            <RowActionButton icon={Pencil} label="Edit" onClick={() => onEdit(payee.id)} />
            <RowActionButton
              icon={payee.is_archived ? ArchiveRestore : ArchiveIcon}
              label={payee.is_archived ? "Unarchive" : "Archive"}
              onClick={() => onArchiveToggle(payee.id, !payee.is_archived)}
            />
            <RowActionButton icon={Trash2} label="Delete" danger onClick={() => onDelete(payee.id)} />
          </div>
        </li>
      ))}
    </ul>
  );
}
