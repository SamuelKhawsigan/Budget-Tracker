import { useEffect, useRef, useState } from "react";
import { AccountPickerModal } from "./AccountPickerModal";
import type { AccountWithBalance } from "../db/accounts";
import type { SweepRule } from "../db/savings";

interface SavingsSettingsPillsProps {
  accounts: AccountWithBalance[];
  savingsAccount: AccountWithBalance | null;
  sweepRule: SweepRule;
  onSelectAccount: (id: number) => void;
  onSelectRule: (rule: SweepRule) => void;
}

// Compact header controls — these are settings, not the page's content, so
// they're pills that open a picker rather than a full always-visible card.
export function SavingsSettingsPills({
  accounts,
  savingsAccount,
  sweepRule,
  onSelectAccount,
  onSelectRule,
}: SavingsSettingsPillsProps) {
  const [accountPickerOpen, setAccountPickerOpen] = useState(false);
  const [ruleMenuOpen, setRuleMenuOpen] = useState(false);
  const ruleMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ruleMenuOpen) return;
    function onDocClick(e: MouseEvent) {
      if (ruleMenuRef.current && !ruleMenuRef.current.contains(e.target as Node)) setRuleMenuOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [ruleMenuOpen]);

  return (
    <div className="savings-settings-pills">
      <button type="button" className="savings-settings-pill" onClick={() => setAccountPickerOpen(true)}>
        Account: <strong>{savingsAccount ? savingsAccount.name : "Not set"}</strong>
      </button>

      <div className="category-card-menu savings-rule-picker" ref={ruleMenuRef}>
        <button type="button" className="savings-settings-pill" onClick={() => setRuleMenuOpen((o) => !o)}>
          Rule: <strong>{sweepRule === "positive" ? "positive" : "net"}</strong>
        </button>
        {ruleMenuOpen && (
          <div className="category-card-menu-popover">
            <button
              type="button"
              className={sweepRule === "net" ? "selected" : undefined}
              onClick={() => {
                onSelectRule("net");
                setRuleMenuOpen(false);
              }}
            >
              Net (budgeted − spent)
            </button>
            <button
              type="button"
              className={sweepRule === "positive" ? "selected" : undefined}
              onClick={() => {
                onSelectRule("positive");
                setRuleMenuOpen(false);
              }}
            >
              Positive categories only
            </button>
          </div>
        )}
      </div>

      {accountPickerOpen && (
        <AccountPickerModal
          title="Savings account"
          accounts={accounts}
          excludeId={null}
          onSelect={(id) => {
            onSelectAccount(id);
            setAccountPickerOpen(false);
          }}
          onClose={() => setAccountPickerOpen(false)}
        />
      )}
    </div>
  );
}
