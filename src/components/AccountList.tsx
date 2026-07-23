import { ArchiveRestore, Archive as ArchiveIcon, Pencil, Trash2 } from "lucide-react";
import type { AccountWithBalance } from "../db/accounts";
import { fromMinorUnits } from "../lib/money";
import { RowActionButton } from "./RowActionButton";

interface AccountListProps {
  accounts: AccountWithBalance[];
  onView: (id: number) => void;
  onEdit: (id: number) => void;
  onArchiveToggle: (id: number, archived: boolean) => void;
  onDelete: (id: number) => void;
}

export function AccountList({ accounts, onView, onEdit, onArchiveToggle, onDelete }: AccountListProps) {
  if (accounts.length === 0) {
    return <p className="empty-state">No accounts yet — add one above.</p>;
  }

  return (
    <ul className="entity-list">
      {accounts.map((account) => (
        <li key={account.id} className={"entity-row" + (account.is_archived ? " archived" : "")}>
          <div className="entity-row-main">
            <button type="button" className="link-button entity-row-title" onClick={() => onView(account.id)}>
              {account.name}
            </button>
            <span className="pill">{account.type}</span>
          </div>
          <span className={"entity-row-value figure" + (account.balance < 0 ? " negative" : " positive")}>
            {account.currency} {fromMinorUnits(account.balance)}
          </span>
          <div className="entity-row-actions">
            <RowActionButton icon={Pencil} label="Edit" onClick={() => onEdit(account.id)} />
            <RowActionButton
              icon={account.is_archived ? ArchiveRestore : ArchiveIcon}
              label={account.is_archived ? "Unarchive" : "Archive"}
              onClick={() => onArchiveToggle(account.id, !account.is_archived)}
            />
            <RowActionButton icon={Trash2} label="Delete" danger onClick={() => onDelete(account.id)} />
          </div>
        </li>
      ))}
    </ul>
  );
}
