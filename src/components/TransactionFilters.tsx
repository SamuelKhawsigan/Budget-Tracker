import type { CategoryOption } from "../db/categories";

interface TransactionFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  type: "" | "income" | "expense";
  onTypeChange: (value: "" | "income" | "expense") => void;
  categoryId: number | "";
  onCategoryChange: (value: number | "") => void;
  categories: CategoryOption[];
}

export function TransactionFilters({
  search,
  onSearchChange,
  type,
  onTypeChange,
  categoryId,
  onCategoryChange,
  categories,
}: TransactionFiltersProps) {
  return (
    <div className="transaction-filters">
      <input
        value={search}
        onChange={(e) => onSearchChange(e.currentTarget.value)}
        placeholder="Search notes or payee..."
      />
      <select
        value={type}
        onChange={(e) => onTypeChange(e.currentTarget.value as "" | "income" | "expense")}
      >
        <option value="">All types</option>
        <option value="income">Income</option>
        <option value="expense">Expense</option>
      </select>
      <select
        value={categoryId}
        onChange={(e) =>
          onCategoryChange(e.currentTarget.value === "" ? "" : Number(e.currentTarget.value))
        }
      >
        <option value="">All categories</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.group_name} / {c.name}
          </option>
        ))}
      </select>
    </div>
  );
}
