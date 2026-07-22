import { useCallback, useEffect, useState } from "react";
import type Database from "@tauri-apps/plugin-sql";
import { listAccounts, type AccountWithBalance } from "../db/accounts";
import { getSetting, setSetting } from "../db/settings";
import {
  closeMonth,
  getProjectedSavings,
  getSweepForMonth,
  type ProjectedSavings,
  type SavingsSweep,
  type SweepRule,
} from "../db/savings";
import { currentMonth, monthLabel, shiftMonth } from "../lib/month";
import { fromMinorUnits } from "../lib/money";

interface SavingsPageProps {
  db: Database;
}

export function SavingsPage({ db }: SavingsPageProps) {
  const [month, setMonth] = useState(currentMonth());
  const [accounts, setAccounts] = useState<AccountWithBalance[]>([]);
  const [savingsAccountId, setSavingsAccountId] = useState<number | "">("");
  const [sweepRule, setSweepRule] = useState<SweepRule>("net");
  const [projected, setProjected] = useState<ProjectedSavings | null>(null);
  const [existingSweep, setExistingSweep] = useState<SavingsSweep | null>(null);
  const [sourceAccountId, setSourceAccountId] = useState<number | "">("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const refreshAccounts = useCallback(async () => {
    setAccounts(await listAccounts(db, false));
  }, [db]);

  const refreshSettings = useCallback(async () => {
    const [savingsSetting, ruleSetting] = await Promise.all([
      getSetting(db, "savings_account_id"),
      getSetting(db, "sweep_rule"),
    ]);
    setSavingsAccountId(savingsSetting ? Number(savingsSetting) : "");
    setSweepRule(ruleSetting === "positive" ? "positive" : "net");
  }, [db]);

  const refreshMonth = useCallback(async () => {
    const [proj, sweep] = await Promise.all([
      getProjectedSavings(db, month, sweepRule),
      getSweepForMonth(db, month),
    ]);
    setProjected(proj);
    setExistingSweep(sweep);
  }, [db, month, sweepRule]);

  useEffect(() => {
    void refreshAccounts();
    void refreshSettings();
  }, [refreshAccounts, refreshSettings]);

  useEffect(() => {
    void refreshMonth();
  }, [refreshMonth]);

  // Default the "from" account once accounts and the savings account are known.
  useEffect(() => {
    if (sourceAccountId === "" && savingsAccountId !== "") {
      const fallback = accounts.find((a) => a.id !== savingsAccountId);
      if (fallback) setSourceAccountId(fallback.id);
    }
  }, [accounts, savingsAccountId, sourceAccountId]);

  async function handleSaveSavingsAccount(id: number) {
    setError(null);
    try {
      await setSetting(db, "savings_account_id", String(id));
      setSavingsAccountId(id);
      if (sourceAccountId === id) {
        setSourceAccountId("");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function handleCloseMonth() {
    if (savingsAccountId === "" || sourceAccountId === "" || !projected) return;
    setError(null);
    setSuccess(null);
    try {
      await closeMonth(db, month, sourceAccountId, savingsAccountId, projected.swept);
      setSuccess(`Swept ${fromMinorUnits(projected.swept)} to savings for ${monthLabel(month)}.`);
      await Promise.all([refreshMonth(), refreshAccounts()]);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <>
      <h1>Savings</h1>

      <div className="inline-form">
        <h2>Savings account</h2>
        <select
          value={savingsAccountId}
          onChange={(e) => void handleSaveSavingsAccount(Number(e.currentTarget.value))}
        >
          <option value="" disabled>
            Choose an account
          </option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        <span className="sweep-rule-note">
          Rule:{" "}
          {sweepRule === "positive"
            ? "positive (categories under budget only)"
            : "net (total budgeted − total spent)"}
        </span>
      </div>

      {error && <p className="form-error">{error}</p>}
      {success && <p className="form-success">{success}</p>}

      <div className="month-nav">
        <button type="button" onClick={() => setMonth((m) => shiftMonth(m, -1))}>
          ← Prev
        </button>
        <span className="month-label">{monthLabel(month)}</span>
        <button type="button" onClick={() => setMonth((m) => shiftMonth(m, 1))}>
          Next →
        </button>
      </div>

      {projected && (
        <div className="cash-summary">
          <span>Budgeted leftover: {fromMinorUnits(projected.rawLeftover)}</span>
          <span>Available cash: {fromMinorUnits(projected.availableCash)}</span>
          <span className="positive">Projected savings this month: {fromMinorUnits(projected.swept)}</span>
        </div>
      )}
      {projected && projected.rawLeftover > projected.availableCash && (
        <p className="clamp-note">Clamped to real cash available this month.</p>
      )}

      {existingSweep ? (
        <p className="empty-state">
          {monthLabel(month)} already swept — {fromMinorUnits(existingSweep.amount)} recorded.
        </p>
      ) : (
        <div className="inline-form">
          <h2>Close month</h2>
          <label>
            From account
            <select
              value={sourceAccountId}
              onChange={(e) => setSourceAccountId(Number(e.currentTarget.value))}
            >
              <option value="" disabled>
                Choose account
              </option>
              {accounts
                .filter((a) => a.id !== savingsAccountId)
                .map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
            </select>
          </label>
          <button
            type="button"
            onClick={handleCloseMonth}
            disabled={savingsAccountId === "" || sourceAccountId === "" || !projected || projected.swept <= 0}
          >
            Close month &amp; sweep {projected ? fromMinorUnits(projected.swept) : ""}
          </button>
        </div>
      )}
    </>
  );
}
