import { useCallback, useEffect, useState } from "react";
import type Database from "@tauri-apps/plugin-sql";
import { Gauge, PieChart as PieChartIcon, TrendingUp } from "lucide-react";
import {
  getMonthCashSummary,
  listCategoryBudgetSummaries,
  type CategoryBudgetSummary,
  type MonthCashSummary,
} from "../db/budgets";
import { getProjectedSavings, type ProjectedSavings, type SweepRule } from "../db/savings";
import { getCategorySpending, getMonthTrend, type CategorySpending, type MonthTrendPoint } from "../db/dashboard";
import { getSetting } from "../db/settings";
import { currentMonth, shiftMonth } from "../lib/month";
import { MonthNav } from "../components/MonthNav";
import { DashboardSummaryCards } from "../components/DashboardSummaryCards";
import { BudgetHealthList } from "../components/BudgetHealthList";
import { SpendingByCategoryChart } from "../components/SpendingByCategoryChart";
import { TrendChart } from "../components/TrendChart";

interface DashboardPageProps {
  db: Database;
}

const TREND_MONTHS = 6;

export function DashboardPage({ db }: DashboardPageProps) {
  const [month, setMonth] = useState(currentMonth());
  const [sweepRule, setSweepRule] = useState<SweepRule>("net");
  const [loading, setLoading] = useState(true);
  const [cash, setCash] = useState<MonthCashSummary | null>(null);
  const [budgetSummaries, setBudgetSummaries] = useState<CategoryBudgetSummary[]>([]);
  const [projected, setProjected] = useState<ProjectedSavings | null>(null);
  const [categorySpending, setCategorySpending] = useState<CategorySpending[]>([]);
  const [trend, setTrend] = useState<MonthTrendPoint[]>([]);

  useEffect(() => {
    void getSetting(db, "sweep_rule").then((rule) => setSweepRule(rule === "positive" ? "positive" : "net"));
  }, [db]);

  const refresh = useCallback(async () => {
    const [cashSummary, budgets, spending, trendPoints, projectedSavings] = await Promise.all([
      getMonthCashSummary(db, month),
      listCategoryBudgetSummaries(db, month),
      getCategorySpending(db, month),
      getMonthTrend(db, month, TREND_MONTHS),
      getProjectedSavings(db, month, sweepRule),
    ]);
    setCash(cashSummary);
    setBudgetSummaries(budgets);
    setCategorySpending(spending);
    setTrend(trendPoints);
    setProjected(projectedSavings);
    setLoading(false);
  }, [db, month, sweepRule]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <>
      <h1>Dashboard</h1>

      <MonthNav month={month} onChange={setMonth} shift={shiftMonth} />

      {loading || !cash || !projected ? (
        <div className="dashboard-card">
          <p className="loading-state">Loading this month's numbers…</p>
        </div>
      ) : (
        <div className="dashboard-grid">
          <DashboardSummaryCards
            income={cash.income}
            expense={cash.expense}
            available={cash.available}
            projectedSavings={projected.swept}
          />

          <div className="dashboard-row-2col">
            <section className="dashboard-card">
              <h2>
                <Gauge size={14} className="section-icon" /> Budget health
              </h2>
              <BudgetHealthList summaries={budgetSummaries} />
            </section>

            <section className="dashboard-card">
              <h2>
                <PieChartIcon size={14} className="section-icon" /> Spending by category
              </h2>
              <SpendingByCategoryChart data={categorySpending} />
            </section>
          </div>

          <section className="dashboard-card">
            <h2>
              <TrendingUp size={14} className="section-icon" /> Income vs. spending — last {TREND_MONTHS} months
            </h2>
            <TrendChart data={trend} />
          </section>
        </div>
      )}
    </>
  );
}
