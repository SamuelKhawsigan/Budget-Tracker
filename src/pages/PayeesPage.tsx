import { useCallback, useEffect, useState } from "react";
import type Database from "@tauri-apps/plugin-sql";
import {
  createPayee,
  deletePayee,
  getPayeeDependencyInfo,
  listAllPayees,
  setPayeeArchived,
  updatePayee,
  type PayeeInput,
} from "../db/payees";
import { listLeafCategories, type CategoryOption } from "../db/categories";
import type { Payee } from "../types";
import { PayeeForm } from "../components/PayeeForm";
import { PayeeList } from "../components/PayeeList";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { useDeleteFlow } from "../lib/useDeleteFlow";

interface PayeesPageProps {
  db: Database;
}

export function PayeesPage({ db }: PayeesPageProps) {
  const [payees, setPayees] = useState<Payee[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const del = useDeleteFlow(setError);

  const refresh = useCallback(async () => {
    setPayees(await listAllPayees(db, showArchived));
  }, [db, showArchived]);

  useEffect(() => {
    void refresh();
    void listLeafCategories(db).then(setCategories);
  }, [db, refresh]);

  async function handleSubmit(values: PayeeInput) {
    setError(null);
    try {
      if (editingId != null) {
        await updatePayee(db, editingId, values);
      } else {
        await createPayee(db, values);
      }
      setEditingId(null);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function handleArchiveToggle(id: number, archived: boolean) {
    await setPayeeArchived(db, id, archived);
    if (editingId === id) setEditingId(null);
    await refresh();
  }

  async function handleDeleteRequest(id: number) {
    const payee = payees.find((p) => p.id === id);
    if (!payee) return;
    setError(null);
    const info = await getPayeeDependencyInfo(db, id);
    del.request({
      title: "Delete payee",
      confirmLabel: "Delete payee",
      message:
        info.transactionCount > 0 ? (
          <>
            Delete <strong>{payee.name}</strong>? Its {info.transactionCount} transaction
            {info.transactionCount === 1 ? "" : "s"} will be kept but lose this payee.
          </>
        ) : (
          <>
            Delete <strong>{payee.name}</strong>?
          </>
        ),
      run: async () => {
        await deletePayee(db, id);
        if (editingId === id) setEditingId(null);
        await refresh();
      },
    });
  }

  const editingPayee = editingId != null ? payees.find((p) => p.id === editingId) ?? null : null;

  return (
    <>
      <h1>Payees</h1>

      {error && <p className="form-error">{error}</p>}

      <PayeeForm
        key={editingId ?? "new"}
        categories={categories}
        initial={editingPayee}
        onSubmit={handleSubmit}
        onCancel={() => setEditingId(null)}
      />

      <label className="show-archived">
        <input
          type="checkbox"
          checked={showArchived}
          onChange={(e) => setShowArchived(e.currentTarget.checked)}
        />
        Show archived payees
      </label>

      <div className="card">
        <PayeeList
          payees={payees}
          categories={categories}
          onEdit={setEditingId}
          onArchiveToggle={handleArchiveToggle}
          onDelete={handleDeleteRequest}
        />
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
