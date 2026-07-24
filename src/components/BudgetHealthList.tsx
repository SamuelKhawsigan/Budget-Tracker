import { getBudgetHealth, type CategoryBudgetSummary } from "../db/budgets";
import { fromMinorUnits } from "../lib/money";
import { CategoryIcon } from "./CategoryIcon";

interface BudgetHealthListProps {
  summaries: CategoryBudgetSummary[];
}

export function BudgetHealthList({ summaries }: BudgetHealthListProps) {
  const budgeted = summaries.filter((s) => s.cap != null);

  if (budgeted.length === 0) {
    return <p className="empty-state">No budgets set for this month yet — set one in Budgets.</p>;
  }

  return (
    <ul className="budget-health-list">
      {budgeted.map((s) => {
        const cap = s.cap ?? 0;
        const health = getBudgetHealth(s.cap, s.spent);
        // The bar's fill can't usefully exceed 100% width, but the percentage
        // text isn't visually constrained that way — showing the real,
        // uncapped number (not clamped like the bar) is what lets someone
        // tell "right at the cap" apart from "3x over" without relying on the
        // fill color alone.
        const actualRatio = cap > 0 ? s.spent / cap : s.spent > 0 ? 1 : 0;
        const barRatio = Math.min(actualRatio, 1);

        return (
          <li key={s.category_id} className={`budget-health-item budget-${health}`}>
            <div className="budget-health-row">
              <span className="budget-health-name">
                <CategoryIcon category={{ id: s.category_id, color: s.color, icon: s.icon }} size={14} />
                <span className="budget-health-name-text">
                  {s.group_name} / {s.category_name}
                </span>
              </span>
              <span className="budget-health-amounts figure">
                {fromMinorUnits(s.spent)} / {fromMinorUnits(cap)}
                <span className="budget-health-pct">{Math.round(actualRatio * 100)}%</span>
              </span>
            </div>
            <div className="budget-health-bar">
              <div className="budget-health-bar-fill" style={{ width: `${barRatio * 100}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
