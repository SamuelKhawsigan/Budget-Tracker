import { fromMinorUnits } from "../lib/money";
import type { TransactionWithDetails } from "../db/transactions";

interface TransactionListProps {
  transactions: TransactionWithDetails[];
  currency: string;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

export function TransactionList({ transactions, currency, onEdit, onDelete }: TransactionListProps) {
  if (transactions.length === 0) {
    return <p className="empty-state">No transactions match.</p>;
  }

  return (
    <table className="transaction-list">
      <thead>
        <tr>
          <th>Date</th>
          <th>Payee</th>
          <th>Category</th>
          <th>Notes</th>
          <th>Amount</th>
          <th aria-label="Actions" />
        </tr>
      </thead>
      <tbody>
        {transactions.map((tx) => (
          <tr key={tx.id}>
            <td>{tx.date}</td>
            <td>{tx.payee_name ?? ""}</td>
            <td>{tx.category_name ?? "Uncategorized"}</td>
            <td>{tx.notes ?? ""}</td>
            <td className={tx.amount < 0 ? "negative" : "positive"}>
              {currency} {fromMinorUnits(tx.amount)}
            </td>
            <td className="transaction-actions">
              <button type="button" onClick={() => onEdit(tx.id)}>
                Edit
              </button>
              <button type="button" onClick={() => onDelete(tx.id)}>
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
