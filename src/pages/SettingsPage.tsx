import { useCallback, useEffect, useRef, useState } from "react";
import type Database from "@tauri-apps/plugin-sql";
import { Pencil, Trash2 } from "lucide-react";
import { listAccounts, type AccountWithBalance } from "../db/accounts";
import { getSetting, setSetting } from "../db/settings";
import {
  deleteCsvMapping,
  listCsvMappings,
  renameCsvMapping,
  type CsvMapping,
} from "../db/csvMappings";
import { backupDatabase } from "../lib/file";
import { useTheme } from "../lib/ThemeContext";
import { FONT_PRESETS, type FontPresetName } from "../lib/fontPresets";
import { THEMES, type ThemeName } from "../lib/themes";
import type { SweepRule } from "../db/savings";
import { RowActionButton } from "../components/RowActionButton";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { ThemeSwatchCard, SystemSwatchCard } from "../components/ThemeSwatchCard";
import { useDeleteFlow } from "../lib/useDeleteFlow";

interface SettingsPageProps {
  db: Database;
}

type BudgetingMode = "available" | "fixed";

const THEME_ENTRIES = Object.entries(THEMES) as [ThemeName, (typeof THEMES)[ThemeName]][];

const FONT_OPTIONS = Object.entries(FONT_PRESETS) as [FontPresetName, (typeof FONT_PRESETS)[FontPresetName]][];

export function SettingsPage({ db }: SettingsPageProps) {
  const { preference, setPreference, fontPresetName, setFontPresetName } = useTheme();

  const [accounts, setAccounts] = useState<AccountWithBalance[]>([]);
  const [budgetingMode, setBudgetingMode] = useState<BudgetingMode>("available");
  const [sweepRule, setSweepRule] = useState<SweepRule>("net");
  const [savingsAccountId, setSavingsAccountId] = useState<number | "">("");

  const [mappings, setMappings] = useState<Record<string, CsvMapping>>({});
  const [renamingName, setRenamingName] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const renameRef = useRef<HTMLInputElement>(null);

  const [error, setError] = useState<string | null>(null);
  const [backupStatus, setBackupStatus] = useState<string | null>(null);
  const del = useDeleteFlow(setError);

  const refreshMappings = useCallback(async () => {
    setMappings(await listCsvMappings(db));
  }, [db]);

  useEffect(() => {
    void listAccounts(db, false).then(setAccounts);
    void refreshMappings();
    void Promise.all([
      getSetting(db, "budgeting_mode"),
      getSetting(db, "sweep_rule"),
      getSetting(db, "savings_account_id"),
    ]).then(([mode, rule, savingsId]) => {
      setBudgetingMode(mode === "fixed" ? "fixed" : "available");
      setSweepRule(rule === "positive" ? "positive" : "net");
      setSavingsAccountId(savingsId ? Number(savingsId) : "");
    });
  }, [db, refreshMappings]);

  useEffect(() => {
    if (renamingName != null) renameRef.current?.focus({ preventScroll: true });
  }, [renamingName]);

  async function handleBudgetingModeChange(mode: BudgetingMode) {
    setBudgetingMode(mode);
    await setSetting(db, "budgeting_mode", mode);
  }

  async function handleSweepRuleChange(rule: SweepRule) {
    setSweepRule(rule);
    await setSetting(db, "sweep_rule", rule);
  }

  async function handleSavingsAccountChange(id: number) {
    setSavingsAccountId(id);
    await setSetting(db, "savings_account_id", String(id));
  }

  function startRename(name: string) {
    setRenamingName(name);
    setRenameValue(name);
  }

  async function commitRename(oldName: string) {
    const next = renameValue.trim();
    setRenamingName(null);
    if (!next || next === oldName) return;
    setError(null);
    try {
      await renameCsvMapping(db, oldName, next);
      await refreshMappings();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  function handleDeleteMappingRequest(name: string) {
    setError(null);
    del.request({
      title: "Delete mapping",
      confirmLabel: "Delete mapping",
      message: (
        <>
          Delete the saved mapping <strong>{name}</strong>? You'll need to re-map columns next time you
          import from this source.
        </>
      ),
      run: async () => {
        await deleteCsvMapping(db, name);
        await refreshMappings();
      },
    });
  }

  async function handleBackup() {
    setError(null);
    setBackupStatus(null);
    try {
      const destination = await backupDatabase();
      if (destination) setBackupStatus(`Backed up to ${destination}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  const mappingNames = Object.keys(mappings).sort((a, b) => a.localeCompare(b));

  return (
    <>
      <h1 className="sr-only">Settings</h1>

      {error && <p className="form-error">{error}</p>}

      <section className="card settings-section">
        <h2>Budgeting</h2>

        <div className="settings-field">
          <label>Budgeting mode</label>
          <div className="type-toggle">
            <button
              type="button"
              className={budgetingMode === "available" ? "active" : undefined}
              onClick={() => void handleBudgetingModeChange("available")}
            >
              Available to budget
            </button>
            <button
              type="button"
              className={budgetingMode === "fixed" ? "active" : undefined}
              onClick={() => void handleBudgetingModeChange("fixed")}
            >
              Fixed budget
            </button>
          </div>
        </div>

        <div className="settings-field">
          <label>Savings sweep rule</label>
          <div className="type-toggle">
            <button
              type="button"
              className={sweepRule === "net" ? "active" : undefined}
              onClick={() => void handleSweepRuleChange("net")}
            >
              Net (budgeted − spent)
            </button>
            <button
              type="button"
              className={sweepRule === "positive" ? "active" : undefined}
              onClick={() => void handleSweepRuleChange("positive")}
            >
              Positive categories only
            </button>
          </div>
        </div>

        <div className="settings-field">
          <label htmlFor="settings-savings-account">Savings account</label>
          <select
            id="settings-savings-account"
            value={savingsAccountId}
            onChange={(e) => void handleSavingsAccountChange(Number(e.currentTarget.value))}
          >
            <option value="" disabled>
              Choose an account
            </option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="card settings-section">
        <h2>Appearance</h2>

        <div className="settings-field">
          <label>Theme</label>
          <div className="theme-swatch-grid">
            {THEME_ENTRIES.map(([name, def]) => (
              <ThemeSwatchCard
                key={name}
                label={def.label}
                colors={def.colors}
                selected={preference === name}
                onSelect={() => setPreference(name)}
              />
            ))}
            <SystemSwatchCard selected={preference === "system"} onSelect={() => setPreference("system")} />
          </div>
        </div>

        <div className="settings-field">
          <label>Font pairing</label>
          <div className="type-toggle">
            {FONT_OPTIONS.map(([name, preset]) => (
              <button
                key={name}
                type="button"
                className={fontPresetName === name ? "active" : undefined}
                onClick={() => setFontPresetName(name)}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <p className="settings-hint">{FONT_PRESETS[fontPresetName].description}</p>
        </div>
      </section>

      <section className="card settings-section">
        <h2>Data</h2>

        <div className="settings-field">
          <label>CSV import mappings</label>
          {mappingNames.length === 0 ? (
            <p className="empty-state">No saved mappings yet — create one during your next CSV import.</p>
          ) : (
            <ul className="entity-list">
              {mappingNames.map((name) => (
                <li key={name} className="entity-row">
                  <div className="entity-row-main">
                    {renamingName === name ? (
                      <input
                        ref={renameRef}
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.currentTarget.value)}
                        onBlur={() => void commitRename(name)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") void commitRename(name);
                          if (e.key === "Escape") setRenamingName(null);
                        }}
                      />
                    ) : (
                      <span className="entity-row-title">{name}</span>
                    )}
                  </div>
                  <div className="entity-row-actions">
                    <RowActionButton icon={Pencil} label="Rename" onClick={() => startRename(name)} />
                    <RowActionButton
                      icon={Trash2}
                      label="Delete"
                      danger
                      onClick={() => handleDeleteMappingRequest(name)}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="settings-field">
          <label>Backup</label>
          <button type="button" onClick={() => void handleBackup()}>
            Export database backup…
          </button>
          {backupStatus && <p className="form-success">{backupStatus}</p>}
        </div>
      </section>

      {del.pending && (
        <ConfirmDialog
          title={del.pending.title}
          message={del.pending.message}
          confirmLabel={del.pending.confirmLabel}
          busy={del.busy}
          onConfirm={del.confirm}
          onCancel={del.cancel}
        />
      )}
    </>
  );
}
