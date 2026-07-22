import type { Category } from "../types";

interface CategoryRowProps {
  category: Category;
  indent?: boolean;
  onEdit: () => void;
  onArchiveToggle: () => void;
}

export function CategoryRow({ category, indent, onEdit, onArchiveToggle }: CategoryRowProps) {
  return (
    <li
      className={
        (indent ? "category-leaf" : "category-group-block") + (category.is_archived ? " archived" : "")
      }
    >
      <div className="category-row">
        <span className="category-swatch" style={{ backgroundColor: category.color ?? "#cccccc" }} />
        {category.icon && <span className="category-icon">{category.icon}</span>}
        <span className="category-name">{category.name}</span>
        <span className="category-row-actions">
          <button type="button" onClick={onEdit}>
            Edit
          </button>
          <button type="button" onClick={onArchiveToggle}>
            {category.is_archived ? "Unarchive" : "Archive"}
          </button>
        </span>
      </div>
    </li>
  );
}
