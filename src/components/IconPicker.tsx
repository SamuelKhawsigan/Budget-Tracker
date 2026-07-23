import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { CATEGORY_ICONS } from "../lib/categoryIcons";

interface IconPickerProps {
  value: string | null;
  onChange: (name: string | null) => void;
}

// Searchable popover grid of curated Lucide icons, storing the icon's name.
// Consistent size/stroke everywhere — no emoji, no free-text field.
export function IconPicker({ value, onChange }: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Not autoFocus: the browser's default focus handling calls scrollIntoView,
  // which walks up the ancestor chain looking for a scrollable container to
  // shift — and finds one no matter how many ancestors get `overflow: clip`,
  // since some level of the app shell legitimately needs to scroll (the
  // sidebar, the content area's vertical scroll). Focusing with
  // `preventScroll: true` skips that walk entirely — no scroll happens, so
  // there's nothing for any ancestor to shift.
  useEffect(() => {
    if (open) {
      searchRef.current?.focus({ preventScroll: true });
    }
  }, [open]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const selected = CATEGORY_ICONS.find((i) => i.name === value) ?? null;
  const query = search.trim().toLowerCase();
  const filtered = query
    ? CATEGORY_ICONS.filter(
        (i) => i.name.toLowerCase().includes(query) || i.keywords.some((k) => k.includes(query)),
      )
    : CATEGORY_ICONS;

  return (
    <div className="icon-picker" ref={ref}>
      <button
        type="button"
        className="icon-picker-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-label={selected ? `Icon: ${selected.name}` : "Choose icon"}
        title={selected ? selected.name : "Choose icon"}
      >
        {selected ? <selected.icon size={16} /> : <span className="icon-picker-placeholder">Icon</span>}
      </button>

      {open && (
        <div className="icon-picker-popover">
          <input
            ref={searchRef}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            placeholder="Search icons…"
            className="icon-picker-search"
          />
          <div className="icon-picker-grid">
            <button
              type="button"
              className={"icon-picker-cell" + (value == null ? " selected" : "")}
              onClick={() => {
                onChange(null);
                setOpen(false);
              }}
              aria-label="No icon"
              title="No icon"
            >
              <X size={16} />
            </button>
            {filtered.map((def) => (
              <button
                key={def.name}
                type="button"
                className={"icon-picker-cell" + (value === def.name ? " selected" : "")}
                onClick={() => {
                  onChange(def.name);
                  setOpen(false);
                }}
                aria-label={def.name}
                title={def.name}
              >
                <def.icon size={16} />
              </button>
            ))}
            {filtered.length === 0 && <p className="icon-picker-empty">No icons match "{search}"</p>}
          </div>
        </div>
      )}
    </div>
  );
}
