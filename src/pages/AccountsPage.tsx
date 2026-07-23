import { useCallback, useEffect, useState } from "react";
import type Database from "@tauri-apps/plugin-sql";
import {
  createAccount,
  deleteAccountCascade,
  getAccountDependencyInfo,
  listAccounts,
  setAccountArchived,
  updateAccount,
  type AccountInput,
  type AccountWithBalance,
} from "../db/accounts";
import { AccountForm } from "../components/AccountForm";
import { AccountGrid } from "../components/AccountGrid";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { fromMinorUnits } from "../lib/money";
import { useDeleteFlow } from "../lib/useDeleteFlow";

interface AccountsPageProps {
  db: Database;
  onSelectAccount: (accountId: number) => void;
}

export function AccountsPage({ db, onSelectAccount }: AccountsPageProps) {
  const [accounts, setAccounts] = useState<AccountWithBalance[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const del = useDeleteFlow(setError);

  const refresh = useCallback(
    async (includeArchived: boolean) => {
      setAccounts(await listAccounts(db, includeArchived));
    },
    [db],
  );

  useEffect(() => {
    void refresh(showArchived);
  }, [refresh, showArchived]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setFormOpen(false);
    }
    if (formOpen) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [formOpen]);

  async function handleSubmit(values: AccountInput) {
    setError(null);
    try {
      if (editingId != null) {
        await updateAccount(db, editingId, values);
      } else {
        await createAccount(db, values);
      }
      setEditingId(null);
      setFormOpen(false);
      await refresh(showArchived);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  function handleAddClick() {
    setEditingId(null);
    setFormOpen(true);
  }

  function handleEditClick(id: number) {
    setEditingId(id);
    setFormOpen(true);
  }

  async function handleArchiveToggle(id: number, archived: boolean) {
    await setAccountArchived(db, id, archived);
    await refresh(showArchived);
  }

  async function handleDeleteRequest(id: number) {
    const account = accounts.find((a) => a.id === id);
    if (!account) return;
    setError(null);
    const info = await getAccountDependencyInfo(db, id);
    del.request({
      title: "Delete account",
      confirmLabel: "Delete account",
      message:
        info.transactionCount > 0 ? (
          <>
            Permanently delete <strong>{account.name}</strong> and its {info.transactionCount}{" "}
            transaction{info.transactionCount === 1 ? "" : "s"}? This can't be undone — archive it instead
            to keep the history.
          </>
        ) : (
          <>
            Permanently delete <strong>{account.name}</strong>? This can't be undone.
          </>
        ),
      run: async () => {
        await deleteAccountCascade(db, id);
        if (editingId === id) {
          setEditingId(null);
          setFormOpen(false);
        }
        await refresh(showArchived);
      },
    });
  }

  const editingAccount = editingId != null ? accounts.find((a) => a.id === editingId) ?? null : null;
  const activeAccounts = accounts.filter((a) => !a.is_archived);
  const total = activeAccounts.reduce((sum, a) => sum + a.balance, 0);
  const totalCurrency = activeAccounts[0]?.currency ?? "MYR";

  return (
    <>
      <div className="page-header-row">
        <h1>Accounts</h1>
        {activeAccounts.length > 0 && (
          <span className="page-header-total">
            Total <span className="figure">{totalCurrency} {fromMinorUnits(total)}</span>
          </span>
        )}
      </div>

      {error && <p className="form-error">{error}</p>}

      <label className="show-archived">
        <input
          type="checkbox"
          checked={showArchived}
          onChange={(e) => setShowArchived(e.currentTarget.checked)}
        />
        Show archived accounts
      </label>

      <AccountGrid
        accounts={accounts}
        onView={onSelectAccount}
        onEdit={handleEditClick}
        onArchiveToggle={handleArchiveToggle}
        onDelete={handleDeleteRequest}
        onAddClick={handleAddClick}
      />

      {formOpen && (
        <div className="modal-backdrop" onClick={() => setFormOpen(false)}>
          <div className="modal-card account-form-modal" onClick={(e) => e.stopPropagation()}>
            <AccountForm
              key={editingId ?? "new"}
              initial={editingAccount}
              onSubmit={handleSubmit}
              onCancel={() => setFormOpen(false)}
            />
          </div>
        </div>
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
