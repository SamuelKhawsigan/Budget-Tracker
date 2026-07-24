import { motion } from "framer-motion";
import { fromMinorUnits } from "../lib/money";
import { monthShortLabel } from "../lib/month";
import { useCountUp } from "../lib/useCountUp";
import type { SavingsSweep } from "../db/savings";

export interface RecentSweepMonth {
  month: string;
  amount: number;
}

interface SavingsHeroCardProps {
  balance: number | null;
  sweeps: SavingsSweep[];
  recentMonths: RecentSweepMonth[];
}

export function SavingsHeroCard({ balance, sweeps, recentMonths }: SavingsHeroCardProps) {
  const balanceDisplay = useCountUp(balance ?? 0);
  const count = sweeps.length;
  const avgPerMonth = count > 0 ? sweeps.reduce((sum, s) => sum + s.amount, 0) / count : 0;
  const maxAmount = Math.max(...recentMonths.map((m) => m.amount), 1);

  return (
    <div className="card savings-hero-card">
      <div className="savings-hero-main">
        <span className="savings-hero-label">Saved so far</span>
        <span className="figure savings-hero-value">
          {balance != null ? fromMinorUnits(Math.round(balanceDisplay)) : "—"}
        </span>
        <span className="savings-hero-subline">
          {count} sweep{count === 1 ? "" : "s"} · avg {fromMinorUnits(Math.round(avgPerMonth))}/mo
        </span>
      </div>

      {recentMonths.length > 0 && (
        <div className="savings-hero-chart">
          {recentMonths.map((m) => (
            <div
              key={m.month}
              className="savings-hero-bar-wrap"
              title={`${monthShortLabel(m.month)}: ${fromMinorUnits(m.amount)}`}
            >
              <div className="savings-hero-bar-track">
                <motion.div
                  className="savings-hero-bar"
                  initial={{ height: 0 }}
                  animate={{ height: `${(m.amount / maxAmount) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <span className="savings-hero-bar-label">{monthShortLabel(m.month).slice(0, 3)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
