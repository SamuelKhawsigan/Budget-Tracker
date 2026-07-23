import { ArrowDownLeft, ArrowUpRight, PiggyBank, Wallet } from "lucide-react";
import { fromMinorUnits } from "../lib/money";

interface DashboardSummaryCardsProps {
  income: number;
  expense: number;
  available: number;
  projectedSavings: number;
}

export function DashboardSummaryCards({
  income,
  expense,
  available,
  projectedSavings,
}: DashboardSummaryCardsProps) {
  return (
    <div className="summary-cards">
      <div className="summary-card">
        <span className="summary-card-label">
          <ArrowDownLeft size={13} /> Income
        </span>
        <span className="summary-card-value positive">{fromMinorUnits(income)}</span>
      </div>
      <div className="summary-card">
        <span className="summary-card-label">
          <ArrowUpRight size={13} /> Spending
        </span>
        <span className="summary-card-value negative">{fromMinorUnits(expense)}</span>
      </div>
      <div className="summary-card">
        <span className="summary-card-label">
          <Wallet size={13} /> Available cash
        </span>
        <span className={"summary-card-value" + (available < 0 ? " negative" : " positive")}>
          {fromMinorUnits(available)}
        </span>
      </div>
      <div className="summary-card">
        <span className="summary-card-label">
          <PiggyBank size={13} /> Projected savings
        </span>
        <span className="summary-card-value positive">{fromMinorUnits(projectedSavings)}</span>
      </div>
    </div>
  );
}
