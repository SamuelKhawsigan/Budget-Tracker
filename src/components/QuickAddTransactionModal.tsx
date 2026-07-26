import { useEffect, useState } from "react";
import type Database from "@tauri-apps/plugin-sql";
import { listAccounts, type AccountWithBalance } from "../db/accounts";
import { listLeafCategories, type CategoryOption } from "../db/categories";
import { findOrCreatePayee, listPayees } from "../db/payees";
import { createTransaction } from "../db/transactions";
import type { Payee } from "../types";
import { TransactionForm, type TransactionFormValues } from "./TransactionForm";

interface QuickAddTransactionModalProps {
  db: Database;
  onClose: () => void;
  onCreated: () => void;
}

// Reachable from the sidebar and every page's "Quick add" header action —
// unlike TransactionsPage's inline form, this one isn't scoped to an
// account already on screen, so it asks for one first.
export function QuickAddTransactionModal({ db, onClose, onCreated }: QuickAddTransactionModalProps) {
  const [accounts, setAccounts] = useState<AccountWithBalance[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [payees, setPayees] = useState<Payee[]>([]);
  const [accountId, setAccountId] = useState<number | "">("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void listAccounts(db, false).then((list) => {
      setAccounts(list);
      setAccountId((current) => (current === "" && list.length > 0 ? list[0].id : current));
    });
    void listLeafCategories(db).then(setCategories);
    void listPayees(db).then(setPayees);
  }, [db]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleSubmit(values: TransactionFormValues) {
    if (accountId === "") {
      setError("Choose an account first");
      return;
    }
    setError(null);
    try {
      const payeeId = values.payeeName ? await findOrCreatePayee(db, values.payeeName) : null;
      await createTransaction(db, {
        accountId,
        date: values.date,
        amount: values.amount,
        type: values.type,
        categoryId: values.categoryId,
        payeeId,
        notes: values.notes,
      });
      onCreated();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card quick-add-modal" onClick={(e) => e.stopPropagation()}>
        {accounts.length === 0 ? (
          <>
            <h2>Quick add</h2>
            <p className="empty-state">You need an account before you can add a transaction.</p>
            <button type="button" onClick={onClose}>
              Close
            </button>
          </>
        ) : (
          <>
            <label>
              Account
              <select value={accountId} onChange={(e) => setAccountId(Number(e.currentTarget.value))}>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </label>

            {error && <p className="form-error">{error}</p>}

            <TransactionForm
              categories={categories}
              payees={payees}
              initial={null}
              onSubmit={handleSubmit}
              onCancel={onClose}
            />
          </>
        )}
      </div>
    </div>
  );
}
