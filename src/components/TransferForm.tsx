import { useState, type FormEvent } from "react";
import { toMinorUnits } from "../lib/money";
import type { AccountWithBalance } from "../db/accounts";
import type { TransferInput } from "../db/transfers";

interface TransferFormProps {
  accounts: AccountWithBalance[];
  onSubmit: (values: TransferInput) => void | Promise<void>;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function TransferForm({ accounts, onSubmit }: TransferFormProps) {
  const [fromAccountId, setFromAccountId] = useState<number | "">(accounts[0]?.id ?? "");
  const [toAccountId, setToAccountId] = useState<number | "">(accounts[1]?.id ?? "");
  const [date, setDate] = useState(today());
  const [amountText, setAmountText] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

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

    setError(null);
    void Promise.resolve(
      onSubmit({
        fromAccountId,
        toAccountId,
        date,
        amount: magnitude,
        notes: notes.trim() || null,
      }),
    ).then(() => {
      setAmountText("");
      setNotes("");
    });
  }

  return (
    <form className="transaction-form" onSubmit={handleSubmit}>
      <h2>Transfer between accounts</h2>

      {error && <p className="form-error">{error}</p>}

      <div className="transaction-form-row">
        <label>
          From
          <select
            value={fromAccountId}
            onChange={(e) =>
              setFromAccountId(e.currentTarget.value === "" ? "" : Number(e.currentTarget.value))
            }
          >
            <option value="">Select account</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          To
          <select
            value={toAccountId}
            onChange={(e) =>
              setToAccountId(e.currentTarget.value === "" ? "" : Number(e.currentTarget.value))
            }
          >
            <option value="">Select account</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="transaction-form-row">
        <label>
          Amount
          <input
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

      <label>
        Notes
        <input value={notes} onChange={(e) => setNotes(e.currentTarget.value)} placeholder="optional" />
      </label>

      <div className="transaction-form-actions">
        <button type="submit">Record transfer</button>
      </div>
    </form>
  );
}
