import { motion } from "framer-motion";
import type { AccountWithBalance } from "../db/accounts";
import { ACCOUNT_TYPE_ICONS } from "./AccountTile";
import { Landmark } from "lucide-react";
import { fromMinorUnits } from "../lib/money";

interface AccountPickerModalProps {
  title: string;
  accounts: AccountWithBalance[];
  excludeId: number | null;
  onSelect: (id: number) => void;
  onClose: () => void;
}

// A modal (not a positioned popover) so it never has to solve viewport-edge
// clipping — the same lesson learned from the category icon picker earlier.
export function AccountPickerModal({ title, accounts, excludeId, onSelect, onClose }: AccountPickerModalProps) {
  const options = accounts.filter((a) => a.id !== excludeId);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card account-picker-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">{title}</h2>
        <ul className="entity-list account-picker-list">
          {options.map((a) => {
            const Icon = ACCOUNT_TYPE_ICONS[a.type] ?? Landmark;
            return (
              <li key={a.id}>
                <motion.button
                  type="button"
                  className="account-picker-option"
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onSelect(a.id)}
                >
                  <span className="account-tile-icon-well account-picker-icon-well">
                    <Icon className="account-tile-icon-glyph" />
                  </span>
                  <span className="account-picker-name">{a.name}</span>
                  <span className={"figure account-picker-balance" + (a.balance < 0 ? " negative" : " positive")}>
                    {a.currency} {fromMinorUnits(a.balance)}
                  </span>
                </motion.button>
              </li>
            );
          })}
        </ul>
        <div className="modal-actions">
          <button type="button" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
