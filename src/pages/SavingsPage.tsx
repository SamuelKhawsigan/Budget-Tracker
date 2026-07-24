import { useCallback, useEffect, useMemo, useState } from "react";
import type Database from "@tauri-apps/plugin-sql";
import { listAccounts, type AccountWithBalance } from "../db/accounts";
import { getSetting, setSetting } from "../db/settings";
import {
  closeMonth,
  getProjectedSavings,
  getSweepForMonth,
  listSavingsSweeps,
  undoSweep,
  type ProjectedSavings,
  type SavingsSweep,
  type SweepRule,
} from "../db/savings";
import { currentMonth, monthLabel, shiftMonth } from "../lib/month";
import { fromMinorUnits } from "../lib/money";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { SavingsSettingsPills } from "../components/SavingsSettingsPills";
import { SavingsHeroCard, type RecentSweepMonth } from "../components/SavingsHeroCard";
import { SavingsThisMonthCard } from "../components/SavingsThisMonthCard";
import { SavingsHistoryCard } from "../components/SavingsHistoryCard";
import { useDeleteFlow } from "../lib/useDeleteFlow";

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
  const [allSweeps, setAllSweeps] = useState<SavingsSweep[]>([]);
  const [sourceAccountId, setSourceAccountId] = useState<number | "">("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const del = useDeleteFlow(setError);

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

  const refreshSweeps = useCallback(async () => {
    setAllSweeps(await listSavingsSweeps(db));
  }, [db]);

  useEffect(() => {
    void refreshAccounts();
    void refreshSettings();
    void refreshSweeps();
  }, [refreshAccounts, refreshSettings, refreshSweeps]);

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

  const recentMonths: RecentSweepMonth[] = useMemo(() => {
    const end = currentMonth();
    const months = Array.from({ length: 6 }, (_, i) => shiftMonth(end, -(5 - i)));
    return months.map((m) => ({ month: m, amount: allSweeps.find((s) => s.month === m)?.amount ?? 0 }));
  }, [allSweeps]);

  async function handleSelectSavingsAccount(id: number) {
    setError(null);
    try {
      await setSetting(db, "savings_account_id", String(id));
      setSavingsAccountId(id);
      if (sourceAccountId === id) setSourceAccountId("");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function handleSelectRule(rule: SweepRule) {
    setError(null);
    try {
      await setSetting(db, "sweep_rule", rule);
      setSweepRule(rule);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function handleCloseMonth() {
    if (savingsAccountId === "" || sourceAccountId === "" || !projected) return;
    setError(null);
    setSuccess(null);
    try {
      const clamped = projected.rawLeftover > projected.availableCash;
      await closeMonth(db, month, sourceAccountId, savingsAccountId, projected.swept, sweepRule, clamped);
      setSuccess(`Swept ${fromMinorUnits(projected.swept)} to savings for ${monthLabel(month)}.`);
      await Promise.all([refreshMonth(), refreshAccounts(), refreshSweeps()]);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  function handleUndoRequest() {
    if (!existingSweep) return;
    setError(null);
    setSuccess(null);
    del.request({
      title: "Undo sweep",
      confirmLabel: "Undo sweep",
      message: (
        <>
          Undo the {monthLabel(month)} sweep? This removes the{" "}
          <strong>{fromMinorUnits(existingSweep.amount)}</strong> transfer to savings and lets you sweep
          the month again.
        </>
      ),
      run: async () => {
        await undoSweep(db, month);
        await Promise.all([refreshMonth(), refreshAccounts(), refreshSweeps()]);
      },
    });
  }

  const savingsAccount = accounts.find((a) => a.id === savingsAccountId) ?? null;

  return (
    <>
      <div className="page-header-row savings-page-header">
        <h1>Savings</h1>
        <SavingsSettingsPills
          accounts={accounts}
          savingsAccount={savingsAccount}
          sweepRule={sweepRule}
          onSelectAccount={(id) => void handleSelectSavingsAccount(id)}
          onSelectRule={(rule) => void handleSelectRule(rule)}
        />
      </div>

      {error && <p className="form-error">{error}</p>}
      {success && <p className="form-success">{success}</p>}

      <SavingsHeroCard balance={savingsAccount?.balance ?? null} sweeps={allSweeps} recentMonths={recentMonths} />

      <div className="savings-layout">
        <SavingsThisMonthCard
          month={month}
          onMonthChange={setMonth}
          projected={projected}
          existingSweep={existingSweep}
          accounts={accounts}
          savingsAccountId={savingsAccountId}
          sourceAccountId={sourceAccountId}
          onSourceAccountChange={setSourceAccountId}
          onCloseMonth={() => void handleCloseMonth()}
          onUndoRequest={handleUndoRequest}
        />

        <SavingsHistoryCard sweeps={allSweeps} />
      </div>

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
