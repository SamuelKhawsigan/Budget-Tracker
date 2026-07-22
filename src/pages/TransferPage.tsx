import { useCallback, useEffect, useState } from "react";
import type Database from "@tauri-apps/plugin-sql";
import { listAccounts, type AccountWithBalance } from "../db/accounts";
import { createTransfer, type TransferInput } from "../db/transfers";
import { TransferForm } from "../components/TransferForm";
import { fromMinorUnits } from "../lib/money";

interface TransferPageProps {
  db: Database;
}

export function TransferPage({ db }: TransferPageProps) {
  const [accounts, setAccounts] = useState<AccountWithBalance[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setAccounts(await listAccounts(db, false));
  }, [db]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleSubmit(values: TransferInput) {
    setError(null);
    setSuccess(null);
    try {
      await createTransfer(db, values);
      await refresh();
      setSuccess("Transfer recorded — balances updated below.");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <>
      <h1>Transfer</h1>

      {error && <p className="form-error">{error}</p>}
      {success && <p className="form-success">{success}</p>}

      {accounts.length < 2 ? (
        <p className="empty-state">You need at least two accounts to make a transfer.</p>
      ) : (
        <TransferForm accounts={accounts} onSubmit={handleSubmit} />
      )}

      <table className="account-list">
        <thead>
          <tr>
            <th>Account</th>
            <th>Balance</th>
          </tr>
        </thead>
        <tbody>
          {accounts.map((a) => (
            <tr key={a.id}>
              <td>{a.name}</td>
              <td className={a.balance < 0 ? "negative" : undefined}>
                {a.currency} {fromMinorUnits(a.balance)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
