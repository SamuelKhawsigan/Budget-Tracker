import { motion } from "framer-motion";
import type { SavingsSweep } from "../db/savings";
import { fromMinorUnits } from "../lib/money";
import { monthLabel } from "../lib/month";

interface SavingsHistoryCardProps {
  sweeps: SavingsSweep[];
}

export function SavingsHistoryCard({ sweeps }: SavingsHistoryCardProps) {
  return (
    <div className="card savings-history-card">
      <h2>Sweep history</h2>
      {sweeps.length === 0 ? (
        <p className="empty-state">No sweeps recorded yet — closing a month will run one automatically.</p>
      ) : (
        <ul className="entity-list savings-history-list">
          {sweeps.map((s, i) => (
            <motion.li
              layout
              key={s.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: i * 0.02 }}
              className="entity-row savings-history-row"
            >
              <div className="entity-row-main">
                <span className="entity-row-title">{monthLabel(s.month)}</span>
                <span className="entity-row-meta">
                  {s.created_at.slice(0, 10)} · {s.rule === "positive" ? "positive rule" : "net rule"}
                  {s.clamped === 1 ? " · clamped" : ""}
                </span>
              </div>
              <span className="figure savings-history-amount">{fromMinorUnits(s.amount)}</span>
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  );
}
