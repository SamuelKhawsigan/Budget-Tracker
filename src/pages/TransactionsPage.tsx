import { useCallback, useEffect, useState } from "react";
import type Database from "@tauri-apps/plugin-sql";
import { getAccountBalance } from "../db";
import { getAccount } from "../db/accounts";
import {
  createTransaction,
  deleteTransaction,
  listTransactions,
  updateTransaction,
  type TransactionFilter,
  type TransactionWithDetails,
} from "../db/transactions";
import { listLeafCategories, type CategoryOption } from "../db/categories";
import { findOrCreatePayee, listPayees } from "../db/payees";
import type { Account, Payee } from "../types";
import { TransactionForm, type TransactionFormValues } from "../components/TransactionForm";
import { TransactionList } from "../components/TransactionList";
import { TransactionFilters } from "../components/TransactionFilters";
import { fromMinorUnits } from "../lib/money";

interface TransactionsPageProps {
  db: Database;
  accountId: number;
  onBack: () => void;
  onImport: () => void;
}

export function TransactionsPage({ db, accountId, onBack, onImport }: TransactionsPageProps) {
  const [account, setAccount] = useState<Account | null>(null);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<TransactionWithDetails[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [payees, setPayees] = useState<Payee[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"" | "income" | "expense">("");
  const [categoryFilter, setCategoryFilter] = useState<number | "">("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refreshAccountAndBalance = useCallback(async () => {
    const [acc, bal] = await Promise.all([getAccount(db, accountId), getAccountBalance(db, accountId)]);
    setAccount(acc);
    setBalance(bal);
  }, [db, accountId]);

  const refreshTransactions = useCallback(async () => {
    const filter: TransactionFilter = {
      search: search.trim() || undefined,
      type: typeFilter || undefined,
      categoryId: categoryFilter === "" ? undefined : categoryFilter,
    };
    setTransactions(await listTransactions(db, accountId, filter));
  }, [db, accountId, search, typeFilter, categoryFilter]);

  const refreshPayees = useCallback(async () => {
    setPayees(await listPayees(db));
  }, [db]);

  useEffect(() => {
    void refreshAccountAndBalance();
    void listLeafCategories(db).then(setCategories);
    void refreshPayees();
  }, [db, accountId, refreshAccountAndBalance, refreshPayees]);

  useEffect(() => {
    void refreshTransactions();
  }, [refreshTransactions]);

  async function handleSubmit(values: TransactionFormValues) {
    setError(null);
    try {
      const payeeId = values.payeeName ? await findOrCreatePayee(db, values.payeeName) : null;
      const input = {
        accountId,
        date: values.date,
        amount: values.amount,
        type: values.type,
        categoryId: values.categoryId,
        payeeId,
        notes: values.notes,
      };

      if (editingId != null) {
        await updateTransaction(db, editingId, input);
        setEditingId(null);
      } else {
        await createTransaction(db, input);
      }

      await Promise.all([refreshTransactions(), refreshAccountAndBalance(), refreshPayees()]);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function handleDelete(id: number) {
    setError(null);
    try {
      await deleteTransaction(db, id);
      if (editingId === id) setEditingId(null);
      await Promise.all([refreshTransactions(), refreshAccountAndBalance()]);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  const editingTransaction = editingId != null ? transactions.find((t) => t.id === editingId) ?? null : null;
  const editingInitial =
    editingTransaction && editingTransaction.type !== "transfer"
      ? {
          date: editingTransaction.date,
          amount: editingTransaction.amount,
          type: editingTransaction.type,
          category_id: editingTransaction.category_id,
          payee_name: editingTransaction.payee_name,
          notes: editingTransaction.notes,
        }
      : null;

  return (
    <div className="transactions-page">
      <div className="page-header page-header-with-action">
        <div>
          <button type="button" className="back-link" onClick={onBack}>
            ← Accounts
          </button>
          <h1>{account?.name ?? "Account"}</h1>
          {account && (
            <p className={"account-balance" + (balance < 0 ? " negative" : "")}>
              {account.currency} {fromMinorUnits(balance)}
            </p>
          )}
        </div>
        <button type="button" className="page-header-action" onClick={onImport}>
          Import transactions…
        </button>
      </div>

      {error && <p className="form-error">{error}</p>}

      <TransactionForm
        key={editingId ?? "new"}
        categories={categories}
        payees={payees}
        initial={editingInitial}
        onSubmit={handleSubmit}
        onCancel={editingId != null ? () => setEditingId(null) : undefined}
      />

      <TransactionFilters
        search={search}
        onSearchChange={setSearch}
        type={typeFilter}
        onTypeChange={setTypeFilter}
        categoryId={categoryFilter}
        onCategoryChange={setCategoryFilter}
        categories={categories}
      />

      <TransactionList
        transactions={transactions}
        currency={account?.currency ?? ""}
        onEdit={setEditingId}
        onDelete={handleDelete}
      />
    </div>
  );
}
