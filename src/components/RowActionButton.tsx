import type { MouseEvent } from "react";
import type { LucideIcon } from "lucide-react";

interface RowActionButtonProps {
  icon: LucideIcon;
  label: string;
  onClick: (e: MouseEvent<HTMLButtonElement>) => void;
  danger?: boolean;
}

// Quiet icon button for row actions (Edit/Archive/Delete) — replaces repeated
// text buttons, dimmed until the row (or the button itself) is hovered/focused.
// `danger` shifts the hover tint to terracotta for destructive actions.
export function RowActionButton({ icon: Icon, label, onClick, danger }: RowActionButtonProps) {
  return (
    <button
      type="button"
      className={"row-icon-btn" + (danger ? " danger" : "")}
      onClick={onClick}
      aria-label={label}
      title={label}
    >
      <Icon size={15} />
    </button>
  );
}
