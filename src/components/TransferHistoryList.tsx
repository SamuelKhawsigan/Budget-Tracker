import { motion } from "framer-motion";
import { ArrowRight, PiggyBank, Pencil, Trash2 } from "lucide-react";
import type { TransferRecord } from "../db/transfers";
import { fromMinorUnits } from "../lib/money";
import { RowActionButton } from "./RowActionButton";

interface TransferHistoryListProps {
  transfers: TransferRecord[];
  onEdit: (transfer: TransferRecord) => void;
  onDelete: (transfer: TransferRecord) => void;
}

export function TransferHistoryList({ transfers, onEdit, onDelete }: TransferHistoryListProps) {
  if (transfers.length === 0) {
    return <p className="empty-state">No transfers yet.</p>;
  }

  return (
    <ul className="entity-list transfer-history-list">
      {transfers.map((t, i) => (
        <motion.li
          key={t.id}
          layout
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, delay: i * 0.02 }}
          className="entity-row transfer-history-row"
        >
          <span className={"transfer-history-icon-well" + (t.isSweep ? " sweep" : "")}>
            {t.isSweep ? <PiggyBank size={15} /> : <ArrowRight size={15} />}
          </span>
          <div className="entity-row-main transfer-history-main">
            <span className="entity-row-title">
              {t.fromAccountName} → {t.toAccountName}
            </span>
            <span className="entity-row-meta">
              {t.isSweep ? "Savings sweep" : "Transfer"} · {t.date}
            </span>
          </div>
          <span className="figure transfer-history-amount">{fromMinorUnits(t.amount)}</span>
          <div className="entity-row-actions">
            <RowActionButton icon={Pencil} label="Edit" onClick={() => onEdit(t)} />
            <RowActionButton icon={Trash2} label="Delete" danger onClick={() => onDelete(t)} />
          </div>
        </motion.li>
      ))}
    </ul>
  );
}
