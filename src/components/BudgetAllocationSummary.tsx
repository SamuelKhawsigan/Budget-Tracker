import { motion } from "framer-motion";
import { fromMinorUnits } from "../lib/money";
import { useCountUp } from "../lib/useCountUp";

interface BudgetAllocationSummaryProps {
  income: number;
  totalCap: number; // Allocated — sum of all caps set this month
  spent: number; // whole-month expense total
}

// The bar is a strict partition of max(income, totalCap): within the income
// zone, spending draws down "spent" then "budgeted, unspent"; any cap total
// beyond income becomes a distinct "overcommitted" segment rather than
// silently overflowing the bar.
export function BudgetAllocationSummary({ income, totalCap, spent }: BudgetAllocationSummaryProps) {
  const unallocated = income - totalCap;
  const overcommitted = Math.max(totalCap - income, 0);
  const effectiveAllocatedWithinIncome = Math.min(totalCap, income);
  const spentWithinIncome = Math.max(Math.min(spent, effectiveAllocatedWithinIncome), 0);
  const budgetedUnspentWithinIncome = Math.max(effectiveAllocatedWithinIncome - spentWithinIncome, 0);
  const trueUnallocated = Math.max(income - totalCap, 0);
  const barTotal = income + overcommitted || 1;

  const pct = (n: number) => Math.max(Math.min((n / barTotal) * 100, 100), 0);

  const unallocatedDisplay = useCountUp(unallocated);
  const incomeDisplay = useCountUp(income);
  const totalCapDisplay = useCountUp(totalCap);
  const spentDisplay = useCountUp(spent);

  return (
    <div className="card budget-summary-card">
      <div className="budget-summary-top">
        <div className="budget-summary-hero">
          <span className="budget-summary-hero-label">Unallocated</span>
          <span className={"figure budget-summary-hero-value" + (unallocated < 0 ? " negative" : "")}>
            {fromMinorUnits(Math.round(unallocatedDisplay))}
          </span>
        </div>
        <div className="budget-summary-line">
          <span>
            Income <span className="figure">{fromMinorUnits(Math.round(incomeDisplay))}</span>
          </span>
          <span>
            Allocated <span className="figure">{fromMinorUnits(Math.round(totalCapDisplay))}</span>
          </span>
          <span>
            Spent <span className="figure">{fromMinorUnits(Math.round(spentDisplay))}</span>
          </span>
        </div>
      </div>

      <div className="budget-summary-bar">
        <motion.div
          className="budget-summary-seg spent"
          initial={{ width: 0 }}
          animate={{ width: `${pct(spentWithinIncome)}%` }}
          transition={{ duration: 0.5 }}
        />
        <motion.div
          className="budget-summary-seg budgeted-unspent"
          initial={{ width: 0 }}
          animate={{ width: `${pct(budgetedUnspentWithinIncome)}%` }}
          transition={{ duration: 0.5 }}
        />
        <motion.div
          className="budget-summary-seg unallocated"
          initial={{ width: 0 }}
          animate={{ width: `${pct(trueUnallocated)}%` }}
          transition={{ duration: 0.5 }}
        />
        {overcommitted > 0 && (
          <motion.div
            className="budget-summary-seg overcommitted"
            initial={{ width: 0 }}
            animate={{ width: `${pct(overcommitted)}%` }}
            transition={{ duration: 0.5 }}
          />
        )}
      </div>

      <div className="budget-summary-legend">
        <span>
          <span className="budget-legend-dot spent" /> Spent
        </span>
        <span>
          <span className="budget-legend-dot budgeted-unspent" /> Budgeted, unspent
        </span>
        <span>
          <span className="budget-legend-dot unallocated" /> Unallocated
        </span>
        {overcommitted > 0 && (
          <span>
            <span className="budget-legend-dot overcommitted" /> Overcommitted
          </span>
        )}
      </div>
    </div>
  );
}
