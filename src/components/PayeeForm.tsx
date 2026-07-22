import { useState, type FormEvent } from "react";
import type { CategoryOption } from "../db/categories";
import type { PayeeInput } from "../db/payees";

interface PayeeFormInitial {
  name: string;
  default_category_id: number | null;
}

interface PayeeFormProps {
  categories: CategoryOption[];
  initial: PayeeFormInitial | null;
  onSubmit: (values: PayeeInput) => void | Promise<void>;
  onCancel: () => void;
}

export function PayeeForm({ categories, initial, onSubmit, onCancel }: PayeeFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [defaultCategoryId, setDefaultCategoryId] = useState<number | "">(
    initial?.default_category_id ?? "",
  );
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    setError(null);
    void Promise.resolve(
      onSubmit({
        name: name.trim(),
        defaultCategoryId: defaultCategoryId === "" ? null : defaultCategoryId,
      }),
    ).then(() => {
      if (!initial) {
        setName("");
        setDefaultCategoryId("");
      }
    });
  }

  return (
    <form className="inline-form" onSubmit={handleSubmit}>
      <h2>{initial ? "Edit payee" : "Add payee"}</h2>
      {error && <p className="form-error">{error}</p>}
      <input
        value={name}
        onChange={(e) => setName(e.currentTarget.value)}
        placeholder={initial ? "Name" : "New payee name"}
      />
      <select
        value={defaultCategoryId}
        onChange={(e) =>
          setDefaultCategoryId(e.currentTarget.value === "" ? "" : Number(e.currentTarget.value))
        }
      >
        <option value="">No default category</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.group_name} / {c.name}
          </option>
        ))}
      </select>
      <button type="submit">{initial ? "Save changes" : "Add payee"}</button>
      {initial && (
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
      )}
    </form>
  );
}
