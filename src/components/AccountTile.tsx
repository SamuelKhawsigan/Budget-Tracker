import { motion } from "framer-motion";
import {
  ArchiveRestore,
  Archive as ArchiveIcon,
  Banknote,
  CreditCard,
  Landmark,
  Pencil,
  PiggyBank,
  Trash2,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { AccountWithBalance } from "../db/accounts";
import type { AccountType } from "../types";
import { fromMinorUnits } from "../lib/money";

const TYPE_ICONS: Record<AccountType, LucideIcon> = {
  checking: Wallet,
  savings: PiggyBank,
  credit: CreditCard,
  cash: Banknote,
  investment: TrendingUp,
  other: Landmark,
};

interface AccountTileProps {
  account: AccountWithBalance;
  index?: number;
  onView?: (id: number) => void;
  onEdit?: (id: number) => void;
  onArchiveToggle?: (id: number, archived: boolean) => void;
  onDelete?: (id: number) => void;
}

// The Accounts page's primary tile, and the same component reused (view-only,
// no action props) for the Savings page's account display so the two pages
// read consistently.
export function AccountTile({
  account,
  index = 0,
  onView,
  onEdit,
  onArchiveToggle,
  onDelete,
}: AccountTileProps) {
  const Icon = TYPE_ICONS[account.type] ?? Landmark;
  const [whole, frac] = fromMinorUnits(account.balance).split(".");
  const hasActions = !!(onEdit || onArchiveToggle || onDelete);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ duration: 0.25, delay: index * 0.03 }}
      whileHover={{ y: -3 }}
      className={"account-tile" + (account.is_archived ? " archived" : "")}
    >
      <button
        type="button"
        className="account-tile-body"
        onClick={onView ? () => onView(account.id) : undefined}
        disabled={!onView}
      >
        <span className="account-tile-icon-well">
          <Icon className="account-tile-icon-glyph" />
        </span>
        <span className="account-tile-name">{account.name}</span>
        <span className="account-tile-pill pill">{account.type}</span>
        <span
          className={"account-tile-balance" + (account.balance < 0 ? " negative" : " positive")}
        >
          <span className="account-tile-whole figure">{whole}</span>
          <span className="account-tile-frac figure">.{frac}</span>
          <span className="account-tile-currency">{account.currency}</span>
        </span>
      </button>

      {hasActions && (
        <div className="account-tile-actions">
          {onEdit && (
            <motion.button
              type="button"
              className="row-icon-btn"
              whileTap={{ scale: 0.85 }}
              onClick={() => onEdit(account.id)}
              aria-label="Edit"
              title="Edit"
            >
              <Pencil size={15} />
            </motion.button>
          )}
          {onArchiveToggle && (
            <motion.button
              type="button"
              className="row-icon-btn"
              whileTap={{ scale: 0.85 }}
              onClick={() => onArchiveToggle(account.id, !account.is_archived)}
              aria-label={account.is_archived ? "Unarchive" : "Archive"}
              title={account.is_archived ? "Unarchive" : "Archive"}
            >
              {account.is_archived ? <ArchiveRestore size={15} /> : <ArchiveIcon size={15} />}
            </motion.button>
          )}
          {onDelete && (
            <motion.button
              type="button"
              className="row-icon-btn danger"
              whileTap={{ scale: 0.85 }}
              onClick={() => onDelete(account.id)}
              aria-label="Delete"
              title="Delete"
            >
              <Trash2 size={15} />
            </motion.button>
          )}
        </div>
      )}
    </motion.div>
  );
}
