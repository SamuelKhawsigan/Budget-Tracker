import { ChevronDown, Landmark } from "lucide-react";
import type { AccountWithBalance } from "../db/accounts";
import { ACCOUNT_TYPE_ICONS } from "./AccountTile";
import { fromMinorUnits } from "../lib/money";

interface ImportAccountRowProps {
  account: AccountWithBalance | null;
  onOpenPicker: () => void;
}

// A rich row (icon, name, type, balance), not a bare <select> — matches how
// accounts are shown everywhere else in the app now.
export function ImportAccountRow({ account, onOpenPicker }: ImportAccountRowProps) {
  const Icon = account ? ACCOUNT_TYPE_ICONS[account.type] ?? Landmark : Landmark;

  return (
    <button type="button" className="import-account-row" onClick={onOpenPicker}>
      <span className="import-account-icon-well">
        <Icon size={18} />
      </span>
      {account ? (
        <>
          <span className="import-account-name">{account.name}</span>
          <span className="pill import-account-type">{account.type}</span>
          <span className={"figure import-account-balance" + (account.balance < 0 ? " negative" : " positive")}>
            {account.currency} {fromMinorUnits(account.balance)}
          </span>
        </>
      ) : (
        <span className="import-account-placeholder">Choose an account…</span>
      )}
      <ChevronDown size={14} className="import-account-chevron" />
    </button>
  );
}
