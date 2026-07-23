import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import type { AccountWithBalance } from "../db/accounts";
import { AccountTile } from "./AccountTile";

type GridTier = "one" | "two" | "few" | "many" | "dense";

// Column tiers scale with account count, not just window width — a couple of
// accounts get large tiles, a dozen get small dense ones. Window width still
// collapses whichever tier is active further (see the App.css media queries).
// "few" and "many" render the same 3-column layout (see App.css) — kept as
// separate tier names in case they ever need to diverge.
function getTier(count: number): GridTier {
  if (count <= 1) return "one";
  if (count === 2) return "two";
  if (count <= 4) return "few";
  if (count <= 8) return "many";
  return "dense";
}

interface AccountGridProps {
  accounts: AccountWithBalance[];
  onView?: (id: number) => void;
  onEdit?: (id: number) => void;
  onArchiveToggle?: (id: number, archived: boolean) => void;
  onDelete?: (id: number) => void;
  onAddClick: () => void;
}

export function AccountGrid({ accounts, onView, onEdit, onArchiveToggle, onDelete, onAddClick }: AccountGridProps) {
  const tier = getTier(accounts.length);

  return (
    <motion.div className="account-grid" data-tier={tier} layout>
      <AnimatePresence>
        {accounts.map((account, i) => (
          <AccountTile
            key={account.id}
            account={account}
            index={i}
            onView={onView}
            onEdit={onEdit}
            onArchiveToggle={onArchiveToggle}
            onDelete={onDelete}
          />
        ))}
        <motion.button
          key="add-account"
          type="button"
          layout
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92 }}
          transition={{ duration: 0.25, delay: accounts.length * 0.03 }}
          className="account-tile account-tile-add"
          onClick={onAddClick}
        >
          <Plus size={22} />
          <span>Add account</span>
        </motion.button>
      </AnimatePresence>
    </motion.div>
  );
}
