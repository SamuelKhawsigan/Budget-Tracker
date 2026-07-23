import { ChevronLeft, ChevronRight } from "lucide-react";
import { monthLabel } from "../lib/month";

interface MonthNavProps {
  month: string;
  onChange: (month: string) => void;
  shift: (month: string, delta: number) => string;
}

// The one month navigator used by Dashboard, Budgets, and Savings — chevron
// icon buttons + a mono month label, never the old "← Prev / Next →" text.
export function MonthNav({ month, onChange, shift }: MonthNavProps) {
  return (
    <div className="month-nav">
      <button
        type="button"
        className="icon-button"
        onClick={() => onChange(shift(month, -1))}
        aria-label="Previous month"
        title="Previous month"
      >
        <ChevronLeft size={16} />
      </button>
      <span className="month-label figure">{monthLabel(month)}</span>
      <button
        type="button"
        className="icon-button"
        onClick={() => onChange(shift(month, 1))}
        aria-label="Next month"
        title="Next month"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
