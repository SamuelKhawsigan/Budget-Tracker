import { useState, type FormEvent } from "react";
import type { CategoryLeafInput } from "../db/categories";

interface CategoryLeafQuickAddProps {
  groupId: number;
  kind: "income" | "expense";
  onSubmit: (input: CategoryLeafInput) => void | Promise<void>;
}

export function CategoryLeafQuickAdd({ groupId, kind, onSubmit }: CategoryLeafQuickAddProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#396cd8");
  const [icon, setIcon] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    void Promise.resolve(
      onSubmit({ name: name.trim(), parentId: groupId, kind, color, icon: icon.trim() || null }),
    ).then(() => {
      setName("");
      setIcon("");
    });
  }

  return (
    <form className="inline-form leaf-quick-add" onSubmit={handleSubmit}>
      <input value={name} onChange={(e) => setName(e.currentTarget.value)} placeholder="+ Add category" />
      <input type="color" value={color} onChange={(e) => setColor(e.currentTarget.value)} title="Color" />
      <input
        value={icon}
        onChange={(e) => setIcon(e.currentTarget.value)}
        placeholder="Icon"
        maxLength={4}
        className="icon-input"
      />
      <button type="submit">Add</button>
    </form>
  );
}
