import type { AccountWithBalance } from "../db/accounts";
import { fromMinorUnits } from "../lib/money";

interface AccountListProps {
  accounts: AccountWithBalance[];
  onView: (id: number) => void;
  onEdit: (id: number) => void;
  onArchiveToggle: (id: number, archived: boolean) => void;
}

export function AccountList({ accounts, onView, onEdit, onArchiveToggle }: AccountListProps) {
  if (accounts.length === 0) {
    return <p className="empty-state">No accounts yet — add one above.</p>;
  }

  return (
    <table className="account-list">
      <thead>
        <tr>
          <th>Name</th>
          <th>Type</th>
          <th>Balance</th>
          <th aria-label="Actions" />
        </tr>
      </thead>
      <tbody>
        {accounts.map((account) => (
          <tr key={account.id} className={account.is_archived ? "archived" : undefined}>
            <td>
              <button type="button" className="link-button" onClick={() => onView(account.id)}>
                {account.name}
              </button>
            </td>
            <td>{account.type}</td>
            <td className={account.balance < 0 ? "negative" : undefined}>
              {account.currency} {fromMinorUnits(account.balance)}
            </td>
            <td className="account-actions">
              <button type="button" onClick={() => onEdit(account.id)}>
                Edit
              </button>
              <button type="button" onClick={() => onArchiveToggle(account.id, !account.is_archived)}>
                {account.is_archived ? "Unarchive" : "Archive"}
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
