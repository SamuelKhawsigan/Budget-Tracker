import { motion } from "framer-motion";
import type { CategoryOption } from "../db/categories";
import type { ImportCandidateRow } from "../types";
import { fromMinorUnits } from "../lib/money";

interface CsvReviewTableProps {
  rows: ImportCandidateRow[];
  categories: CategoryOption[];
  currency: string;
  onToggleSelected: (key: string, selected: boolean) => void;
  onCategoryChange: (key: string, categoryId: number | null) => void;
}

export function CsvReviewTable({
  rows,
  categories,
  currency,
  onToggleSelected,
  onCategoryChange,
}: CsvReviewTableProps) {
  if (rows.length === 0) {
    return <p className="empty-state">No rows parsed from this file — check it's a valid CSV and go back to try another.</p>;
  }

  return (
    <table className="transaction-list csv-review-table">
      <thead>
        <tr>
          <th aria-label="Include" />
          <th>Date</th>
          <th>Description</th>
          <th>Category</th>
          <th>Notes</th>
          <th>Amount</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const disabled = row.isDuplicate || !!row.parseError;
          const options = categories.filter((c) => c.kind === row.type);
          return (
            <motion.tr layout key={row.key} className={disabled ? "archived" : undefined}>
              <td>
                <input
                  type="checkbox"
                  checked={row.selected}
                  disabled={disabled}
                  onChange={(e) => onToggleSelected(row.key, e.currentTarget.checked)}
                />
              </td>
              <td>{row.date || "—"}</td>
              <td>{row.description || "—"}</td>
              <td>
                <select
                  value={row.categoryId ?? ""}
                  disabled={disabled}
                  onChange={(e) =>
                    onCategoryChange(row.key, e.currentTarget.value === "" ? null : Number(e.currentTarget.value))
                  }
                >
                  <option value="">Uncategorized</option>
                  {options.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.group_name} / {c.name}
                    </option>
                  ))}
                </select>
              </td>
              <td>{row.notes ?? ""}</td>
              <td className={row.amount < 0 ? "negative" : "positive"}>
                {currency} {fromMinorUnits(row.amount)}
              </td>
              <td>
                {row.parseError ? `Error: ${row.parseError}` : row.isDuplicate ? "Duplicate" : "New"}
              </td>
            </motion.tr>
          );
        })}
      </tbody>
    </table>
  );
}
