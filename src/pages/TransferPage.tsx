import { useCallback, useEffect, useState, type FormEvent } from "react";
import type Database from "@tauri-apps/plugin-sql";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { listAccounts, type AccountWithBalance } from "../db/accounts";
import {
  createTransfer,
  deleteTransfer,
  listTransfers,
  type TransferInput,
  type TransferRecord,
} from "../db/transfers";
import { fromMinorUnits, toMinorUnits } from "../lib/money";
import { AccountTile } from "../components/AccountTile";
import { AccountPickerModal } from "../components/AccountPickerModal";
import { TransferHistoryList } from "../components/TransferHistoryList";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { useDeleteFlow } from "../lib/useDeleteFlow";

interface TransferPageProps {
  db: Database;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

const QUICK_AMOUNTS = [10, 20, 50, 100];

export function TransferPage({ db }: TransferPageProps) {
  const [accounts, setAccounts] = useState<AccountWithBalance[]>([]);
  const [transfers, setTransfers] = useState<TransferRecord[]>([]);
  const [fromAccountId, setFromAccountId] = useState<number | "">("");
  const [toAccountId, setToAccountId] = useState<number | "">("");
  const [amountText, setAmountText] = useState("");
  const [date, setDate] = useState(today());
  const [notes, setNotes] = useState("");
  const [pickerSide, setPickerSide] = useState<"from" | "to" | null>(null);
  const [swapFlip, setSwapFlip] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const del = useDeleteFlow(setError);

  const refreshAccounts = useCallback(async () => {
    setAccounts(await listAccounts(db, false));
  }, [db]);

  const refreshTransfers = useCallback(async () => {
    setTransfers(await listTransfers(db));
  }, [db]);

  useEffect(() => {
    void refreshAccounts();
    void refreshTransfers();
  }, [refreshAccounts, refreshTransfers]);

  // Default from/to to the first two accounts once they've loaded — but only
  // the first time, never clobbering a choice the user (or an edit) already made.
  useEffect(() => {
    if (accounts.length >= 2 && fromAccountId === "" && toAccountId === "") {
      setFromAccountId(accounts[0].id);
      setToAccountId(accounts[1].id);
    }
  }, [accounts, fromAccountId, toAccountId]);

  const fromAccount = accounts.find((a) => a.id === fromAccountId) ?? null;
  const toAccount = accounts.find((a) => a.id === toAccountId) ?? null;

  let amountMinor = 0;
  try {
    amountMinor = amountText.trim() ? toMinorUnits(amountText) : 0;
  } catch {
    amountMinor = 0;
  }

  const fromAfter = fromAccount ? fromAccount.balance - amountMinor : null;
  const toAfter = toAccount ? toAccount.balance + amountMinor : null;
  const insufficientFunds = fromAfter != null && amountMinor > 0 && fromAfter < 0;

  function handleSwap() {
    setSwapFlip((f) => !f);
    const prevFrom = fromAccountId;
    setFromAccountId(toAccountId);
    setToAccountId(prevFrom);
  }

  function handleQuickAmount(major: number) {
    setAmountText(major.toFixed(2));
  }

  function handleAllAmount() {
    if (fromAccount && fromAccount.balance > 0) {
      setAmountText(fromMinorUnits(fromAccount.balance));
    }
  }

  function resetForm() {
    setAmountText("");
    setNotes("");
    setDate(today());
    setEditingId(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (fromAccountId === "" || toAccountId === "") {
      setError("Choose both accounts");
      return;
    }
    if (fromAccountId === toAccountId) {
      setError("Source and destination accounts must be different");
      return;
    }

    let magnitude: number;
    try {
      magnitude = toMinorUnits(amountText);
    } catch {
      setError("Amount must be a valid number, e.g. 12.50");
      return;
    }
    if (magnitude <= 0) {
      setError("Amount must be greater than zero");
      return;
    }
    if (fromAccount && fromAccount.balance - magnitude < 0) {
      setError(`Insufficient funds — this would take ${fromAccount.name} negative.`);
      return;
    }

    const values: TransferInput = {
      fromAccountId,
      toAccountId,
      date,
      amount: magnitude,
      notes: notes.trim() || null,
    };

    try {
      if (editingId != null) {
        await deleteTransfer(db, editingId);
      }
      await createTransfer(db, values);
      resetForm();
      await Promise.all([refreshAccounts(), refreshTransfers()]);
      setSuccess("Transfer recorded.");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  function handleEditRequest(t: TransferRecord) {
    setError(null);
    setSuccess(null);
    setEditingId(t.id);
    setFromAccountId(t.fromAccountId);
    setToAccountId(t.toAccountId);
    setAmountText(fromMinorUnits(t.amount));
    setDate(t.date);
    setNotes(t.notes ?? "");
  }

  function handleDeleteRequest(t: TransferRecord) {
    setError(null);
    del.request({
      title: "Delete transfer",
      confirmLabel: "Delete transfer",
      message: (
        <>
          Delete the transfer of <strong>{fromMinorUnits(t.amount)}</strong> from{" "}
          <strong>{t.fromAccountName}</strong> to <strong>{t.toAccountName}</strong>? Both sides are removed
          together.
        </>
      ),
      run: async () => {
        await deleteTransfer(db, t.id);
        if (editingId === t.id) resetForm();
        await Promise.all([refreshAccounts(), refreshTransfers()]);
      },
    });
  }

  const canSubmit =
    fromAccountId !== "" && toAccountId !== "" && fromAccountId !== toAccountId && amountMinor > 0 && !insufficientFunds;

  let submitDisabledReason: string | null = null;
  if (fromAccountId === "" || toAccountId === "") submitDisabledReason = "Choose both accounts";
  else if (fromAccountId === toAccountId) submitDisabledReason = "Source and destination must be different";
  else if (amountMinor <= 0) submitDisabledReason = "Enter an amount greater than zero";
  else if (insufficientFunds) submitDisabledReason = "Insufficient funds in the source account";

  return (
    <>
      <h1>Transfer</h1>

      {error && <p className="form-error">{error}</p>}
      {success && <p className="form-success">{success}</p>}

      <div className="transfer-layout">
        {accounts.length < 2 ? (
          <p className="empty-state">You need at least two accounts to make a transfer — add one in Accounts.</p>
        ) : (
          <form className="card transfer-form-card" onSubmit={handleSubmit}>
            {editingId != null && (
              <div className="transfer-editing-banner">
                Editing a previous transfer
                <button type="button" className="link-button" onClick={resetForm}>
                  Cancel
                </button>
              </div>
            )}

            <div className="transfer-tiles-row">
              <div className="transfer-tile-slot">
                {fromAccount && <AccountTile account={fromAccount} onView={() => setPickerSide("from")} />}
              </div>

              <motion.button
                type="button"
                className="transfer-swap-btn"
                onClick={handleSwap}
                whileTap={{ scale: 0.85 }}
                animate={{ rotate: swapFlip ? 180 : 0 }}
                transition={{ duration: 0.3 }}
                aria-label="Swap from and to"
                title="Swap from and to"
              >
                <ArrowRight size={20} />
              </motion.button>

              <div className="transfer-tile-slot">
                {toAccount && <AccountTile account={toAccount} onView={() => setPickerSide("to")} />}
              </div>
            </div>

            <div className="transfer-amount-section">
              <div className="transfer-amount-hero">
                <span className="transfer-amount-currency">{fromAccount?.currency ?? "MYR"}</span>
                <input
                  className="transfer-amount-input figure"
                  value={amountText}
                  onChange={(e) => setAmountText(e.currentTarget.value)}
                  placeholder="0.00"
                  inputMode="decimal"
                />
              </div>
              <div className="transfer-hairline" />
              <div className="quick-amount-chips">
                {QUICK_AMOUNTS.map((amt) => (
                  <motion.button
                    key={amt}
                    type="button"
                    className="quick-amount-chip"
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleQuickAmount(amt)}
                  >
                    {amt}
                  </motion.button>
                ))}
                <motion.button
                  type="button"
                  className="quick-amount-chip"
                  whileTap={{ scale: 0.9 }}
                  onClick={handleAllAmount}
                  disabled={!fromAccount || fromAccount.balance <= 0}
                  title={!fromAccount || fromAccount.balance <= 0 ? "Source account has no balance to transfer" : undefined}
                >
                  All
                </motion.button>
              </div>
            </div>

            <div className="transaction-form-row transfer-meta-row">
              <label>
                Date
                <input type="date" value={date} onChange={(e) => setDate(e.currentTarget.value)} />
              </label>
              <label>
                Note<span className="field-optional">(optional)</span>
                <input value={notes} onChange={(e) => setNotes(e.currentTarget.value)} placeholder="optional" />
              </label>
            </div>

            {fromAccount && toAccount && (
              <div className="transfer-preview-strip">
                <div className="transfer-preview-item">
                  <span className="transfer-preview-label">{fromAccount.name} after</span>
                  <motion.span
                    key={`from-${fromAfter}`}
                    initial={{ opacity: 0.3 }}
                    animate={{ opacity: 1 }}
                    className={"figure transfer-preview-value" + (fromAfter != null && fromAfter < 0 ? " negative" : "")}
                  >
                    {fromAfter != null ? fromMinorUnits(fromAfter) : "—"}
                  </motion.span>
                </div>
                <ArrowRight size={16} className="transfer-preview-arrow" />
                <div className="transfer-preview-item">
                  <span className="transfer-preview-label">{toAccount.name} after</span>
                  <motion.span
                    key={`to-${toAfter}`}
                    initial={{ opacity: 0.3 }}
                    animate={{ opacity: 1 }}
                    className={"figure transfer-preview-value" + (toAfter != null && toAfter < 0 ? " negative" : "")}
                  >
                    {toAfter != null ? fromMinorUnits(toAfter) : "—"}
                  </motion.span>
                </div>
              </div>
            )}

            {insufficientFunds && (
              <p className="form-error">
                Insufficient funds — this would take {fromAccount?.name} negative.
              </p>
            )}

            <button
              type="submit"
              className="btn-primary transfer-submit"
              disabled={!canSubmit}
              title={submitDisabledReason ?? undefined}
            >
              {editingId != null ? "Save changes" : "Record transfer"}
            </button>
          </form>
        )}

        <div className="card transfer-history-card">
          <h2>Recent transfers</h2>
          <TransferHistoryList transfers={transfers} onEdit={handleEditRequest} onDelete={handleDeleteRequest} />
        </div>
      </div>

      {pickerSide && (
        <AccountPickerModal
          title={pickerSide === "from" ? "Transfer from" : "Transfer to"}
          accounts={accounts}
          excludeId={pickerSide === "from" ? (toAccountId === "" ? null : toAccountId) : fromAccountId === "" ? null : fromAccountId}
          onSelect={(id) => {
            if (pickerSide === "from") setFromAccountId(id);
            else setToAccountId(id);
            setPickerSide(null);
          }}
          onClose={() => setPickerSide(null)}
        />
      )}

      {del.pending && (
        <ConfirmDialog
          title={del.pending.title}
          message={del.pending.message}
          confirmLabel={del.pending.confirmLabel}
          busy={del.busy}
          onConfirm={del.confirm}
          onCancel={del.cancel}
        />
      )}
    </>
  );
}
