import { useState, type FormEvent } from "react";
import type { CategoryGroupInput } from "../db/categories";
import { ColorSwatchPicker } from "./ColorSwatchPicker";
import { IconPicker } from "./IconPicker";
import { categoryPalette } from "../lib/theme";

interface CategoryGroupFormProps {
  onSubmit: (values: CategoryGroupInput) => void | Promise<void>;
}

export function CategoryGroupForm({ onSubmit }: CategoryGroupFormProps) {
  const [name, setName] = useState("");
  const [kind, setKind] = useState<"income" | "expense">("expense");
  const [color, setColor] = useState<string>(categoryPalette[0]);
  const [icon, setIcon] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    setError(null);
    void Promise.resolve(onSubmit({ name: name.trim(), kind, color, icon })).then(() => setName(""));
  }

  return (
    <form className="inline-form" onSubmit={handleSubmit}>
      <h2>Add category group</h2>
      {error && <p className="form-error">{error}</p>}
      <input
        value={name}
        onChange={(e) => setName(e.currentTarget.value)}
        placeholder="Group name (e.g. Food)"
      />
      <select value={kind} onChange={(e) => setKind(e.currentTarget.value as "income" | "expense")}>
        <option value="expense">Expense</option>
        <option value="income">Income</option>
      </select>
      <ColorSwatchPicker value={color} onChange={setColor} />
      <IconPicker value={icon} onChange={setIcon} />
      <button type="submit" className="btn-primary">
        Add group
      </button>
    </form>
  );
}
