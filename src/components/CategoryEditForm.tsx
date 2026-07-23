import { useState, type FormEvent } from "react";
import type { CategoryUpdateInput } from "../db/categories";
import { ColorSwatchPicker } from "./ColorSwatchPicker";
import { IconPicker } from "./IconPicker";
import { categoryPalette } from "../lib/theme";

interface CategoryEditFormInitial {
  name: string;
  color: string | null;
  icon: string | null;
}

interface CategoryEditFormProps {
  initial: CategoryEditFormInitial;
  onSubmit: (values: CategoryUpdateInput) => void | Promise<void>;
  onCancel: () => void;
}

export function CategoryEditForm({ initial, onSubmit, onCancel }: CategoryEditFormProps) {
  const [name, setName] = useState(initial.name);
  const [color, setColor] = useState<string>(initial.color ?? categoryPalette[0]);
  const [icon, setIcon] = useState<string | null>(initial.icon);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    setError(null);
    void onSubmit({ name: name.trim(), color, icon });
  }

  return (
    <form className="inline-form" onSubmit={handleSubmit}>
      <h2>Edit category</h2>
      {error && <p className="form-error">{error}</p>}
      <input value={name} onChange={(e) => setName(e.currentTarget.value)} placeholder="Name" />
      <ColorSwatchPicker value={color} onChange={setColor} />
      <IconPicker value={icon} onChange={setIcon} />
      <button type="submit">Save</button>
      <button type="button" onClick={onCancel}>
        Cancel
      </button>
    </form>
  );
}
