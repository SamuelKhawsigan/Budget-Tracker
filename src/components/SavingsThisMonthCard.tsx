import type { AccountWithBalance } from "../db/accounts";
import type { ProjectedSavings, SavingsSweep } from "../db/savings";
import { fromMinorUnits } from "../lib/money";
import { shiftMonth } from "../lib/month";
import { useCountUp } from "../lib/useCountUp";
import { MonthNav } from "./MonthNav";

interface SavingsThisMonthCardProps {
  month: string;
  onMonthChange: (month: string) => void;
  projected: ProjectedSavings | null;
  existingSweep: SavingsSweep | null;
  accounts: AccountWithBalance[];
  savingsAccountId: number | "";
  sourceAccountId: number | "";
  onSourceAccountChange: (id: number) => void;
  onCloseMonth: () => void;
  onUndoRequest: () => void;
}

export function SavingsThisMonthCard({
  month,
  onMonthChange,
  projected,
  existingSweep,
  accounts,
  savingsAccountId,
  sourceAccountId,
  onSourceAccountChange,
  onCloseMonth,
  onUndoRequest,
}: SavingsThisMonthCardProps) {
  const swept = projected?.swept ?? 0;
  const sweptDisplay = useCountUp(swept);
  const clamped = projected != null && projected.rawLeftover > projected.availableCash;

  let disabledReason: string | null = null;
  if (savingsAccountId === "") disabledReason = "Choose a savings account first";
  else if (sourceAccountId === "") disabledReason = "Choose a source account";
  else if (!projected || projected.swept <= 0) disabledReason = "Nothing to sweep this month";

  return (
    <div className="card savings-month-card">
      <div className="savings-month-header">
        <h2>This month</h2>
        <MonthNav month={month} onChange={onMonthChange} shift={shiftMonth} />
      </div>

      {projected && (
        <>
          <div className="savings-math-rows">
            <div className="savings-math-row">
              <span>Budgeted leftover</span>
              <span className="figure">{fromMinorUnits(projected.rawLeftover)}</span>
            </div>
            <div className="savings-math-row">
              <span>
                Available cash <span className="savings-math-note">(the ceiling)</span>
              </span>
              <span className="figure">{fromMinorUnits(projected.availableCash)}</span>
            </div>
            <div className="savings-hairline" />
            <div className="savings-math-row savings-math-row-hero">
              <span>Projected sweep</span>
              <span className="figure savings-projected-value">{fromMinorUnits(Math.round(sweptDisplay))}</span>
            </div>
          </div>

          <p className={"savings-clamp-strip" + (clamped ? " clamped" : "")}>
            {clamped
              ? "Clamped to available cash — leftover exceeds real cash this month."
              : "Under the cash ceiling — full leftover can be swept."}
          </p>

          {existingSweep ? (
            <div className="savings-swept-row">
              <span className="empty-state">
                Swept <span className="figure">{fromMinorUnits(existingSweep.amount)}</span> on{" "}
                {existingSweep.created_at.slice(0, 10)}.
              </span>
              <button type="button" className="link-button savings-undo-btn" onClick={onUndoRequest}>
                Undo
              </button>
            </div>
          ) : (
            <div className="savings-action-row">
              <label className="savings-source-select">
                From
                <select
                  value={sourceAccountId}
                  onChange={(e) => onSourceAccountChange(Number(e.currentTarget.value))}
                >
                  <option value="" disabled>
                    Choose account
                  </option>
                  {accounts
                    .filter((a) => a.id !== savingsAccountId)
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                </select>
              </label>
              <button
                type="button"
                className="btn-primary"
                onClick={onCloseMonth}
                disabled={!!disabledReason}
                title={disabledReason ?? undefined}
              >
                Close month &amp; sweep
              </button>
              {disabledReason && <span className="savings-disabled-reason">{disabledReason}</span>}
            </div>
          )}
        </>
      )}
    </div>
  );
}
