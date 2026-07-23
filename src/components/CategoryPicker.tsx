import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { CategoryOption } from "../db/categories";
import { CategoryIcon } from "./CategoryIcon";

interface CategoryPickerProps {
  categories: CategoryOption[]; // pre-filtered to the relevant kind by the caller
  value: number | null;
  onChange: (id: number | null) => void;
  placeholder?: string;
  id?: string;
}

// A custom combobox (not a native <select>) so each option can show the
// category's actual icon/color — native <option> elements can't render rich
// content. Grouped by the category's group, matching the old <optgroup> order.
export function CategoryPicker({
  categories,
  value,
  onChange,
  placeholder = "Uncategorized",
  id,
}: CategoryPickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const selected = categories.find((c) => c.id === value) ?? null;

  const groups: { groupName: string; options: CategoryOption[] }[] = [];
  for (const c of categories) {
    const group = groups.find((g) => g.groupName === c.group_name);
    if (group) group.options.push(c);
    else groups.push({ groupName: c.group_name, options: [c] });
  }

  return (
    <div className="category-picker" ref={ref}>
      <button
        type="button"
        id={id}
        className="category-picker-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="category-picker-trigger-content">
          {selected ? (
            <>
              <CategoryIcon category={selected} size={15} />
              <span>{selected.name}</span>
            </>
          ) : (
            <span className="category-picker-placeholder">{placeholder}</span>
          )}
        </span>
        <ChevronDown size={14} />
      </button>

      {open && (
        <div className="category-picker-menu" role="listbox">
          <button
            type="button"
            className={"category-picker-option" + (value == null ? " selected" : "")}
            onClick={() => {
              onChange(null);
              setOpen(false);
            }}
            role="option"
            aria-selected={value == null}
          >
            {placeholder}
          </button>
          {groups.map((g) => (
            <div key={g.groupName} className="category-picker-group">
              <div className="category-picker-group-label">{g.groupName}</div>
              {g.options.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={"category-picker-option" + (value === c.id ? " selected" : "")}
                  onClick={() => {
                    onChange(c.id);
                    setOpen(false);
                  }}
                  role="option"
                  aria-selected={value === c.id}
                >
                  <CategoryIcon category={c} size={15} />
                  <span>{c.name}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
