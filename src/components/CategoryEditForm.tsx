import { useState, type FormEvent } from "react";
import type { CategoryUpdateInput } from "../db/categories";

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
  const [color, setColor] = useState(initial.color ?? "#396cd8");
  const [icon, setIcon] = useState(initial.icon ?? "");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    setError(null);
    void onSubmit({ name: name.trim(), color, icon: icon.trim() || null });
  }

  return (
    <form className="inline-form" onSubmit={handleSubmit}>
      <h2>Edit category</h2>
      {error && <p className="form-error">{error}</p>}
      <input value={name} onChange={(e) => setName(e.currentTarget.value)} placeholder="Name" />
      <input type="color" value={color} onChange={(e) => setColor(e.currentTarget.value)} title="Color" />
      <input
        value={icon}
        onChange={(e) => setIcon(e.currentTarget.value)}
        placeholder="Icon (emoji)"
        maxLength={4}
        className="icon-input"
      />
      <button type="submit">Save</button>
      <button type="button" onClick={onCancel}>
        Cancel
      </button>
    </form>
  );
}
