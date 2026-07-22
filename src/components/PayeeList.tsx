import type { Payee } from "../types";
import type { CategoryOption } from "../db/categories";

interface PayeeListProps {
  payees: Payee[];
  categories: CategoryOption[];
  onEdit: (id: number) => void;
  onArchiveToggle: (id: number, archived: boolean) => void;
}

export function PayeeList({ payees, categories, onEdit, onArchiveToggle }: PayeeListProps) {
  if (payees.length === 0) {
    return <p className="empty-state">No payees yet.</p>;
  }

  function categoryLabel(id: number | null): string {
    if (id == null) return "—";
    const category = categories.find((c) => c.id === id);
    return category ? `${category.group_name} / ${category.name}` : "—";
  }

  return (
    <table className="payee-list">
      <thead>
        <tr>
          <th>Name</th>
          <th>Default category</th>
          <th aria-label="Actions" />
        </tr>
      </thead>
      <tbody>
        {payees.map((payee) => (
          <tr key={payee.id} className={payee.is_archived ? "archived" : undefined}>
            <td>{payee.name}</td>
            <td>{categoryLabel(payee.default_category_id)}</td>
            <td className="account-actions">
              <button type="button" onClick={() => onEdit(payee.id)}>
                Edit
              </button>
              <button type="button" onClick={() => onArchiveToggle(payee.id, !payee.is_archived)}>
                {payee.is_archived ? "Unarchive" : "Archive"}
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
