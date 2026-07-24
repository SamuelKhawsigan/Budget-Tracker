import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Archive as ArchiveIcon,
  ArchiveRestore,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import type { Category } from "../types";
import { CategoryIcon } from "./CategoryIcon";
import { RowActionButton } from "./RowActionButton";
import { fromMinorUnits } from "../lib/money";
import { getCategoryColor } from "../lib/theme";
import { useTheme } from "../lib/ThemeContext";
import type { CategoryPopoverTarget } from "./CategoryEditorPopover";

interface CategoryGroupCardProps {
  group: Category;
  leaves: Category[];
  activity: Map<number, number>;
  index: number;
  onOpenPopover: (target: CategoryPopoverTarget, anchorRect: DOMRect) => void;
  onArchiveToggle: (id: number, archived: boolean) => void;
  onDeleteRequest: (id: number) => void;
}

export function CategoryGroupCard({
  group,
  leaves,
  activity,
  index,
  onOpenPopover,
  onArchiveToggle,
  onDeleteRequest,
}: CategoryGroupCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!menuOpen) return;
    function onDocClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [menuOpen]);

  const groupSpend = leaves.reduce((sum, l) => sum + (activity.get(l.id) ?? 0), 0);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25, delay: index * 0.03 }}
      className={"card category-group-card" + (group.is_archived ? " archived" : "")}
    >
      <div className="category-group-card-header">
        <span
          className="category-group-dot"
          style={{ backgroundColor: getCategoryColor(resolvedTheme, group) }}
        />
        <span className="category-group-card-name">{group.name}</span>
        {groupSpend > 0 && (
          <span className="figure category-group-card-spend">{fromMinorUnits(groupSpend)}</span>
        )}

        <div className="category-card-menu" ref={menuRef}>
          <RowActionButton
            icon={MoreHorizontal}
            label="Group options"
            onClick={() => setMenuOpen((o) => !o)}
          />
          {menuOpen && (
            <div className="category-card-menu-popover">
              <button
                type="button"
                onClick={(e) => {
                  setMenuOpen(false);
                  onOpenPopover(
                    { mode: "edit", id: group.id, name: group.name, color: group.color, icon: group.icon },
                    e.currentTarget.getBoundingClientRect(),
                  );
                }}
              >
                <Pencil size={14} /> Edit
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onArchiveToggle(group.id, !group.is_archived);
                }}
              >
                {group.is_archived ? <ArchiveRestore size={14} /> : <ArchiveIcon size={14} />}
                {group.is_archived ? "Unarchive" : "Archive"}
              </button>
              <button
                type="button"
                className="danger"
                onClick={() => {
                  setMenuOpen(false);
                  onDeleteRequest(group.id);
                }}
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <ul className="category-leaf-list">
        {leaves.map((leaf) => {
          const spend = activity.get(leaf.id) ?? 0;
          return (
            <motion.li
              layout
              key={leaf.id}
              className={"category-leaf-row" + (leaf.is_archived ? " archived" : "")}
            >
              <span
                className="category-leaf-icon-well"
                style={{
                  backgroundColor: `color-mix(in srgb, ${getCategoryColor(resolvedTheme, leaf)} 16%, transparent)`,
                }}
              >
                <CategoryIcon category={leaf} size={15} />
              </span>
              <span className="category-leaf-name">{leaf.name}</span>
              {spend > 0 && <span className="figure category-leaf-spend">{fromMinorUnits(spend)}</span>}
              <span className="category-leaf-actions">
                <RowActionButton
                  icon={Pencil}
                  label="Edit"
                  onClick={(e) =>
                    onOpenPopover(
                      { mode: "edit", id: leaf.id, name: leaf.name, color: leaf.color, icon: leaf.icon },
                      e.currentTarget.getBoundingClientRect(),
                    )
                  }
                />
                <RowActionButton icon={Trash2} label="Delete" danger onClick={() => onDeleteRequest(leaf.id)} />
              </span>
            </motion.li>
          );
        })}

        <li className="category-leaf-row category-leaf-add-row">
          <button
            type="button"
            className="category-add-row-btn"
            onClick={(e) =>
              onOpenPopover(
                { mode: "add-leaf", groupId: group.id, kind: group.kind },
                e.currentTarget.getBoundingClientRect(),
              )
            }
          >
            <Plus size={14} /> Add
          </button>
        </li>
      </ul>
    </motion.div>
  );
}
