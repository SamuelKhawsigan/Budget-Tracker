import { useCallback, useEffect, useState } from "react";
import type Database from "@tauri-apps/plugin-sql";
import { motion } from "framer-motion";
import { getPayee } from "../db/payees";
import { listTransactionsByPayee, type PayeeTransactionRow } from "../db/transactions";
import type { Payee } from "../types";
import { fromMinorUnits } from "../lib/money";

interface PayeeTransactionsPageProps {
  db: Database;
  payeeId: number;
  onBack: () => void;
}

// The Payees page's "click a tile to drill through" destination — a
// read-only, cross-account list (a payee isn't scoped to one account the
// way TransactionsPage's ledger is). Editing stays on the account ledger
// where each transaction actually lives, rather than duplicating that whole
// form/category/payee-picker surface here.
export function PayeeTransactionsPage({ db, payeeId, onBack }: PayeeTransactionsPageProps) {
  const [payee, setPayee] = useState<Payee | null>(null);
  const [rows, setRows] = useState<PayeeTransactionRow[]>([]);

  const refresh = useCallback(async () => {
    const [p, txns] = await Promise.all([getPayee(db, payeeId), listTransactionsByPayee(db, payeeId)]);
    setPayee(p);
    setRows(txns);
  }, [db, payeeId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const total = rows.reduce((sum, r) => sum + r.amount, 0);

  return (
    <>
      <div className="page-header">
        <button type="button" className="back-link" onClick={onBack}>
          ← Payees
        </button>
        <h1>{payee?.name ?? "Payee"}</h1>
        {rows.length > 0 && (
          <p className={"account-balance figure" + (total < 0 ? " negative" : "")}>{fromMinorUnits(total)}</p>
        )}
      </div>

      <div className="card">
        {rows.length === 0 ? (
          <p className="empty-state">No transactions for this payee yet.</p>
        ) : (
          <ul className="entity-list">
            {rows.map((r, i) => (
              <motion.li
                layout
                key={r.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: i * 0.02 }}
                className="entity-row"
              >
                <div className="entity-row-main">
                  <span className="entity-row-title">{r.category_name ?? "Uncategorized"}</span>
                  <span className="entity-row-meta">
                    {r.account_name} · {r.date}
                    {r.notes ? ` · ${r.notes}` : ""}
                  </span>
                </div>
                <span className={"figure entity-row-value" + (r.amount < 0 ? " negative" : " positive")}>
                  {r.currency} {fromMinorUnits(r.amount)}
                </span>
              </motion.li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
