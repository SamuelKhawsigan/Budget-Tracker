import { useEffect, useRef, useState, type FormEvent } from "react";
import { fromMinorUnits, toMinorUnits } from "../lib/money";
import type { CategoryOption } from "../db/categories";
import type { Payee } from "../types";
import { CategoryPicker } from "./CategoryPicker";

type TxType = "income" | "expense";

export interface TransactionFormValues {
  date: string;
  amount: number; // signed minor units
  type: TxType;
  categoryId: number | null;
  payeeName: string;
  notes: string | null;
}

interface TransactionFormInitial {
  date: string;
  amount: number; // signed minor units
  type: TxType;
  category_id: number | null;
  payee_name: string | null;
  notes: string | null;
}

interface TransactionFormProps {
  categories: CategoryOption[];
  payees: Payee[];
  initial: TransactionFormInitial | null;
  onSubmit: (values: TransactionFormValues) => void | Promise<void>;
  onCancel?: () => void;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function TransactionForm({
  categories,
  payees,
  initial,
  onSubmit,
  onCancel,
}: TransactionFormProps) {
  const [date, setDate] = useState(initial?.date ?? today());
  const [type, setType] = useState<TxType>(initial?.type ?? "expense");
  const [amountText, setAmountText] = useState(
    initial ? fromMinorUnits(Math.abs(initial.amount)) : "",
  );
  const [categoryId, setCategoryId] = useState<number | "">(initial?.category_id ?? "");
  const [payeeName, setPayeeName] = useState(initial?.payee_name ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [validationError, setValidationError] = useState<string | null>(null);
  const amountRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    amountRef.current?.focus({ preventScroll: true });
  }, []);

  const filteredCategories = categories.filter((c) => c.kind === type);

  // Auto-fill the category from the payee's default_category_id, but only
  // when nothing has been chosen yet — never clobber an explicit selection —
  // and only when that default matches the currently selected income/expense
  // type, so it doesn't select a category the dropdown isn't showing.
  function handlePayeeNameChange(value: string) {
    setPayeeName(value);
    if (categoryId !== "") return;

    const match = payees.find((p) => p.name.toLowerCase() === value.trim().toLowerCase());
    if (match?.default_category_id == null) return;

    const defaultCategory = categories.find((c) => c.id === match.default_category_id);
    if (defaultCategory && defaultCategory.kind === type) {
      setCategoryId(defaultCategory.id);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    let magnitude: number;
    try {
      magnitude = toMinorUnits(amountText);
    } catch {
      setValidationError("Amount must be a valid number, e.g. 12.50");
      return;
    }
    if (magnitude === 0) {
      setValidationError("Amount can't be zero");
      return;
    }

    setValidationError(null);
    const signedAmount = type === "expense" ? -Math.abs(magnitude) : Math.abs(magnitude);

    void Promise.resolve(
      onSubmit({
        date,
        amount: signedAmount,
        type,
        categoryId: categoryId === "" ? null : categoryId,
        payeeName: payeeName.trim(),
        notes: notes.trim() || null,
      }),
    ).then(() => {
      if (!initial) {
        // Quick-add: clear and refocus so the next entry can start right away.
        setAmountText("");
        setCategoryId("");
        setPayeeName("");
        setNotes("");
        amountRef.current?.focus({ preventScroll: true });
      }
    });
  }

  return (
    <form className="transaction-form" onSubmit={handleSubmit}>
      <h2>{initial ? "Edit transaction" : "Quick add"}</h2>

      {validationError && <p className="form-error">{validationError}</p>}

      <div className="type-toggle" role="radiogroup" aria-label="Transaction type">
        <button
          type="button"
          className={type === "expense" ? "active" : undefined}
          aria-pressed={type === "expense"}
          onClick={() => setType("expense")}
        >
          Expense
        </button>
        <button
          type="button"
          className={type === "income" ? "active" : undefined}
          aria-pressed={type === "income"}
          onClick={() => setType("income")}
        >
          Income
        </button>
      </div>

      <div className="transaction-form-row">
        <label>
          Amount<span className="field-required" title="Required">*</span>
          <input
            ref={amountRef}
            value={amountText}
            onChange={(e) => setAmountText(e.currentTarget.value)}
            placeholder="0.00"
            inputMode="decimal"
          />
        </label>

        <label>
          Date
          <input type="date" value={date} onChange={(e) => setDate(e.currentTarget.value)} />
        </label>
      </div>

      <div className="transaction-form-row">
        <label>
          Category
          <CategoryPicker
            categories={filteredCategories}
            value={categoryId === "" ? null : categoryId}
            onChange={(id) => setCategoryId(id ?? "")}
          />
        </label>

        <label>
          Payee<span className="field-optional">(optional)</span>
          <input
            list="payee-suggestions"
            value={payeeName}
            onChange={(e) => handlePayeeNameChange(e.currentTarget.value)}
            placeholder="e.g. Grocery Mart"
          />
        </label>
        <datalist id="payee-suggestions">
          {payees.map((p) => (
            <option key={p.id} value={p.name} />
          ))}
        </datalist>
      </div>

      <label>
        Notes<span className="field-optional">(optional)</span>
        <input value={notes} onChange={(e) => setNotes(e.currentTarget.value)} placeholder="optional" />
      </label>

      <div className="transaction-form-actions">
        <button type="submit">{initial ? "Save changes" : "Add transaction"}</button>
        {onCancel && (
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
