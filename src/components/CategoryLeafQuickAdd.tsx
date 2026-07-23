import { useState, type FormEvent } from "react";
import type { CategoryLeafInput } from "../db/categories";
import { ColorSwatchPicker } from "./ColorSwatchPicker";
import { IconPicker } from "./IconPicker";
import { categoryPalette } from "../lib/theme";

interface CategoryLeafQuickAddProps {
  groupId: number;
  kind: "income" | "expense";
  onSubmit: (input: CategoryLeafInput) => void | Promise<void>;
}

export function CategoryLeafQuickAdd({ groupId, kind, onSubmit }: CategoryLeafQuickAddProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState<string>(categoryPalette[0]);
  const [icon, setIcon] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    void Promise.resolve(onSubmit({ name: name.trim(), parentId: groupId, kind, color, icon })).then(() => {
      setName("");
      setIcon(null);
    });
  }

  return (
    <form className="inline-form leaf-quick-add" onSubmit={handleSubmit}>
      <input value={name} onChange={(e) => setName(e.currentTarget.value)} placeholder="+ Add category" />
      <ColorSwatchPicker value={color} onChange={setColor} />
      <IconPicker value={icon} onChange={setIcon} />
      <button type="submit">Add</button>
    </form>
  );
}
