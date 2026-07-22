import { useCallback, useEffect, useState } from "react";
import type Database from "@tauri-apps/plugin-sql";
import {
  createAccount,
  listAccounts,
  setAccountArchived,
  updateAccount,
  type AccountInput,
  type AccountWithBalance,
} from "../db/accounts";
import { AccountForm } from "../components/AccountForm";
import { AccountList } from "../components/AccountList";

interface AccountsPageProps {
  db: Database;
  onSelectAccount: (accountId: number) => void;
}

export function AccountsPage({ db, onSelectAccount }: AccountsPageProps) {
  const [accounts, setAccounts] = useState<AccountWithBalance[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(
    async (includeArchived: boolean) => {
      setAccounts(await listAccounts(db, includeArchived));
    },
    [db],
  );

  useEffect(() => {
    void refresh(showArchived);
  }, [refresh, showArchived]);

  async function handleSubmit(values: AccountInput) {
    setError(null);
    try {
      if (editingId != null) {
        await updateAccount(db, editingId, values);
      } else {
        await createAccount(db, values);
      }
      setEditingId(null);
      await refresh(showArchived);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function handleArchiveToggle(id: number, archived: boolean) {
    await setAccountArchived(db, id, archived);
    await refresh(showArchived);
  }

  const editingAccount = editingId != null ? accounts.find((a) => a.id === editingId) ?? null : null;

  return (
    <>
      <h1>Accounts</h1>

      {error && <p className="form-error">{error}</p>}

      <AccountForm
        key={editingId ?? "new"}
        initial={editingAccount}
        onSubmit={handleSubmit}
        onCancel={() => setEditingId(null)}
      />

      <label className="show-archived">
        <input
          type="checkbox"
          checked={showArchived}
          onChange={(e) => setShowArchived(e.currentTarget.checked)}
        />
        Show archived accounts
      </label>

      <AccountList
        accounts={accounts}
        onView={onSelectAccount}
        onEdit={setEditingId}
        onArchiveToggle={handleArchiveToggle}
      />
    </>
  );
}
