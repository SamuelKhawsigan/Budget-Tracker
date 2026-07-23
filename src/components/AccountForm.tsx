import { useState, type FormEvent } from "react";
import { ACCOUNT_TYPES, type AccountType } from "../types";
import { fromMinorUnits, toMinorUnits } from "../lib/money";
import type { AccountInput } from "../db/accounts";

interface AccountFormInitial {
  name: string;
  type: AccountType;
  currency: string;
  opening_balance: number;
}

interface AccountFormProps {
  initial: AccountFormInitial | null;
  onSubmit: (values: AccountInput) => void | Promise<void>;
  onCancel: () => void;
}

export function AccountForm({ initial, onSubmit, onCancel }: AccountFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [type, setType] = useState<AccountType>(initial?.type ?? "checking");
  const [currency, setCurrency] = useState(initial?.currency ?? "MYR");
  const [openingBalanceText, setOpeningBalanceText] = useState(
    initial ? fromMinorUnits(initial.opening_balance) : "0.00",
  );
  const [validationError, setValidationError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      setValidationError("Name is required");
      return;
    }

    let openingBalance: number;
    try {
      openingBalance = toMinorUnits(openingBalanceText);
    } catch {
      setValidationError("Opening balance must be a valid amount, e.g. 12.50");
      return;
    }

    setValidationError(null);
    void onSubmit({
      name: name.trim(),
      type,
      currency: currency.trim().toUpperCase() || "MYR",
      openingBalance,
    });
  }

  return (
    <form className="account-form" onSubmit={handleSubmit}>
      <h2>{initial ? "Edit account" : "Add account"}</h2>

      {validationError && <p className="form-error">{validationError}</p>}

      <div className="form-grid-2">
        <label>
          Name
          <input
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
            placeholder="e.g. Main Account"
          />
        </label>

        <label>
          Type
          <select value={type} onChange={(e) => setType(e.currentTarget.value as AccountType)}>
            {ACCOUNT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>

        <label>
          Currency
          <input
            value={currency}
            onChange={(e) => setCurrency(e.currentTarget.value)}
            maxLength={3}
          />
        </label>

        <label>
          Opening balance
          <input
            className="figure"
            value={openingBalanceText}
            onChange={(e) => setOpeningBalanceText(e.currentTarget.value)}
            placeholder="0.00"
            inputMode="decimal"
          />
        </label>
      </div>

      <div className="account-form-actions">
        <button type="submit" className="btn-primary">
          {initial ? "Save changes" : "Add account"}
        </button>
        {initial && (
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
