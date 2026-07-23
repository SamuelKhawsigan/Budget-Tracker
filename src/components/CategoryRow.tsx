import { ArchiveRestore, Archive as ArchiveIcon, Pencil, Trash2 } from "lucide-react";
import type { Category } from "../types";
import { RowActionButton } from "./RowActionButton";
import { CategoryIcon } from "./CategoryIcon";

interface CategoryRowProps {
  category: Category;
  indent?: boolean;
  onEdit: () => void;
  onArchiveToggle: () => void;
  onDelete: () => void;
}

export function CategoryRow({ category, indent, onEdit, onArchiveToggle, onDelete }: CategoryRowProps) {
  return (
    <li
      className={
        (indent ? "category-leaf" : "category-group-block") + (category.is_archived ? " archived" : "")
      }
    >
      <div className="category-row">
        <CategoryIcon category={category} size={16} />
        <span className="category-name">{category.name}</span>
        <span className="category-row-actions">
          <RowActionButton icon={Pencil} label="Edit" onClick={onEdit} />
          <RowActionButton
            icon={category.is_archived ? ArchiveRestore : ArchiveIcon}
            label={category.is_archived ? "Unarchive" : "Archive"}
            onClick={onArchiveToggle}
          />
          <RowActionButton icon={Trash2} label="Delete" danger onClick={onDelete} />
        </span>
      </div>
    </li>
  );
}
