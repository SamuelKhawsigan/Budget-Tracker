import { useCallback, useEffect, useState } from "react";
import type Database from "@tauri-apps/plugin-sql";
import { AnimatePresence, motion } from "framer-motion";
import { listAccounts, type AccountWithBalance } from "../db/accounts";
import { listLeafCategories, type CategoryOption } from "../db/categories";
import { findOrCreatePayee, findPayeesByNames } from "../db/payees";
import { createImportedTransaction, getExistingImportHashes } from "../db/transactions";
import { listCsvMappings, saveCsvMapping, type CsvMapping } from "../db/csvMappings";
import { listRecentImportBatches, recordImportBatch, type ImportBatch } from "../db/importBatches";
import { parseCsv } from "../lib/csv";
import { parseImportAmount, parseImportDate } from "../lib/importParsing";
import { importHashInput, sha256Hex } from "../lib/hash";
import type { ImportCandidateRow } from "../types";
import { CsvMappingForm } from "../components/CsvMappingForm";
import { CsvReviewTable } from "../components/CsvReviewTable";
import { ImportStepRail, type ImportStep } from "../components/ImportStepRail";
import { ImportAccountRow } from "../components/ImportAccountRow";
import { ImportDropZone } from "../components/ImportDropZone";
import { AccountPickerModal } from "../components/AccountPickerModal";

interface ImportPageProps {
  db: Database;
  preselectedAccountId?: number;
  onNavigateToAccounts: () => void;
  onNavigateToSettings: () => void;
}

export function ImportPage({ db, preselectedAccountId, onNavigateToAccounts, onNavigateToSettings }: ImportPageProps) {
  const [accounts, setAccounts] = useState<AccountWithBalance[]>([]);
  const [accountId, setAccountId] = useState<number | "">(preselectedAccountId ?? "");
  const [accountPickerOpen, setAccountPickerOpen] = useState(false);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [mappingProfiles, setMappingProfiles] = useState<Record<string, CsvMapping>>({});
  const [recentImports, setRecentImports] = useState<ImportBatch[]>([]);

  const [currentStep, setCurrentStep] = useState<ImportStep>(1);
  const [furthestStep, setFurthestStep] = useState<ImportStep>(1);

  const [fileName, setFileName] = useState("");
  const [rawRows, setRawRows] = useState<string[][] | null>(null);
  const [suggestedProfileName, setSuggestedProfileName] = useState("");
  const [lastMapping, setLastMapping] = useState<{ profileName: string; mapping: CsvMapping } | null>(null);
  const [rows, setRows] = useState<ImportCandidateRow[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  const refreshRecentImports = useCallback(async () => {
    setRecentImports(await listRecentImportBatches(db));
  }, [db]);

  useEffect(() => {
    void listAccounts(db, false).then(setAccounts);
    void listLeafCategories(db).then(setCategories);
    void listCsvMappings(db).then(setMappingProfiles);
    void refreshRecentImports();
  }, [db, refreshRecentImports]);

  function goToStep(step: ImportStep) {
    if (step <= furthestStep) setCurrentStep(step);
  }

  function handleFilePicked(name: string, text: string) {
    if (accountId === "") {
      setError("Choose an account first");
      return;
    }
    setError(null);
    setSuccess(null);
    const parsed = parseCsv(text);
    if (parsed.length === 0) {
      setError("That file has no rows");
      return;
    }
    setFileName(name);
    setRawRows(parsed);
    setSuggestedProfileName(name.replace(/\.csv$/i, ""));
    setCurrentStep(2);
    setFurthestStep((f) => Math.max(f, 2) as ImportStep);
  }

  async function handleMappingContinue(profileName: string, mapping: CsvMapping) {
    if (!rawRows || accountId === "") return;
    setError(null);

    try {
      await saveCsvMapping(db, profileName, mapping);
      setMappingProfiles((prev) => ({ ...prev, [profileName]: mapping }));
      setLastMapping({ profileName, mapping });

      const dataRows = mapping.hasHeader ? rawRows.slice(1) : rawRows;
      const existingHashes = await getExistingImportHashes(db, accountId);
      const descriptions = dataRows.map((r) => (r[mapping.descriptionColumn] ?? "").trim());
      const payeeMatches = await findPayeesByNames(db, descriptions);

      const seenInBatch = new Set<string>();
      const candidates: ImportCandidateRow[] = [];

      for (let i = 0; i < dataRows.length; i++) {
        const raw = dataRows[i];
        const description = (raw[mapping.descriptionColumn] ?? "").trim();
        const notesRaw = mapping.notesColumn != null ? (raw[mapping.notesColumn] ?? "").trim() : "";

        let date = "";
        let amount = 0;
        let parseError: string | null = null;

        try {
          date = parseImportDate(raw[mapping.dateColumn] ?? "");
          amount = parseImportAmount(raw[mapping.amountColumn] ?? "");
          if (!description) {
            throw new Error("Missing description");
          }
        } catch (e) {
          parseError = e instanceof Error ? e.message : String(e);
        }

        const type: "income" | "expense" = amount < 0 ? "expense" : "income";
        let importHash = "";
        let isDuplicate = false;

        if (!parseError) {
          importHash = await sha256Hex(importHashInput(accountId, date, amount, description));
          isDuplicate = existingHashes.has(importHash) || seenInBatch.has(importHash);
          seenInBatch.add(importHash);
        }

        let categoryId: number | null = null;
        const matchedPayee = payeeMatches.get(description.toLowerCase());
        if (matchedPayee?.default_category_id != null) {
          const cat = categories.find((c) => c.id === matchedPayee.default_category_id);
          if (cat && cat.kind === type) {
            categoryId = cat.id;
          }
        }

        candidates.push({
          key: String(i),
          date,
          description,
          notes: notesRaw || null,
          amount,
          type,
          categoryId,
          importHash,
          isDuplicate,
          selected: !isDuplicate && !parseError,
          parseError,
        });
      }

      setRows(candidates);
      setCurrentStep(3);
      setFurthestStep((f) => Math.max(f, 3) as ImportStep);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  function handleToggleSelected(key: string, selected: boolean) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, selected } : r)));
  }

  function handleCategoryChange(key: string, categoryId: number | null) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, categoryId } : r)));
  }

  async function handleCommit() {
    if (accountId === "") return;
    setError(null);
    setImporting(true);

    let inserted = 0;
    let skipped = 0;
    let failed = 0;

    try {
      for (const row of rows) {
        if (!row.selected || row.isDuplicate || row.parseError) {
          skipped++;
          continue;
        }
        try {
          const payeeId = await findOrCreatePayee(db, row.description);
          await createImportedTransaction(db, {
            accountId,
            date: row.date,
            amount: row.amount,
            type: row.type,
            categoryId: row.categoryId,
            payeeId,
            notes: row.notes,
            importHash: row.importHash,
          });
          inserted++;
        } catch {
          // Most likely the unique import_hash index caught a duplicate that
          // slipped past the pre-check — the DB constraint is the backstop.
          failed++;
        }
      }

      await recordImportBatch(db, accountId, fileName, inserted, skipped + failed);
      setSuccess(`Imported ${inserted} transaction${inserted === 1 ? "" : "s"}. Skipped ${skipped + failed}.`);
      setCurrentStep(1);
      setFurthestStep(1);
      setRawRows(null);
      setRows([]);
      setFileName("");
      await refreshRecentImports();
    } finally {
      setImporting(false);
    }
  }

  const selectedAccount = accounts.find((a) => a.id === accountId) ?? null;
  const newCount = rows.filter((r) => r.selected && !r.isDuplicate && !r.parseError).length;
  const duplicateCount = rows.filter((r) => r.isDuplicate).length;
  const errorCount = rows.filter((r) => r.parseError).length;
  const mappingNames = Object.keys(mappingProfiles).sort((a, b) => a.localeCompare(b));

  return (
    <>
      <h1>Import CSV</h1>

      {accounts.length > 0 && (
        <ImportStepRail currentStep={currentStep} furthestStep={furthestStep} onStepClick={goToStep} />
      )}

      {error && <p className="form-error">{error}</p>}
      {success && <p className="form-success">{success}</p>}

      {accounts.length === 0 ? (
        <div className="card import-empty-card">
          <p className="empty-state">You need an account before you can import transactions.</p>
          <button type="button" className="btn-primary" onClick={onNavigateToAccounts}>
            Go to Accounts
          </button>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="import-step1-layout"
            >
              <div className="import-step1-main">
                <div className="card">
                  <h2>Import into</h2>
                  <ImportAccountRow account={selectedAccount} onOpenPicker={() => setAccountPickerOpen(true)} />
                </div>

                <ImportDropZone
                  disabled={accountId === ""}
                  onFilePicked={handleFilePicked}
                  onError={setError}
                />
                {accountId === "" && <p className="import-drop-zone-hint">Choose an account above first.</p>}
              </div>

              <div className="import-step1-side">
                <div className="card import-recent-card">
                  <h2>Recent imports</h2>
                  {recentImports.length === 0 ? (
                    <p className="empty-state">No imports yet — drop a CSV on the left to bring in transactions.</p>
                  ) : (
                    <ul className="entity-list">
                      {recentImports.map((b) => (
                        <li key={b.id} className="entity-row import-recent-row">
                          <div className="entity-row-main">
                            <span className="entity-row-title">{b.file_name}</span>
                            <span className="entity-row-meta">
                              {b.account_name} · {b.created_at.slice(0, 10)}
                            </span>
                          </div>
                          <span className="import-recent-counts">
                            <span className="positive">{b.inserted_count} added</span>
                            {b.skipped_count > 0 && (
                              <span className="import-recent-skipped"> · {b.skipped_count} skipped</span>
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="card import-mappings-card">
                  <h2>Saved mappings</h2>
                  {mappingNames.length === 0 ? (
                    <p className="empty-state">None saved yet — you'll be prompted to name one during your first import.</p>
                  ) : (
                    <div className="import-mapping-chips">
                      {mappingNames.map((name) => (
                        <span key={name} className="pill import-mapping-chip">
                          {name}
                        </span>
                      ))}
                    </div>
                  )}
                  <button type="button" className="link-button import-manage-link" onClick={onNavigateToSettings}>
                    Manage in Settings →
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === 2 && rawRows && (
            <motion.div
              key="step2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="card import-step-card"
            >
              <CsvMappingForm
                firstRow={rawRows[0]}
                secondRow={rawRows[1] ?? null}
                existingProfiles={mappingProfiles}
                suggestedProfileName={lastMapping?.profileName ?? suggestedProfileName}
                initial={lastMapping?.mapping ?? null}
                onContinue={handleMappingContinue}
              />
            </motion.div>
          )}

          {currentStep === 3 && selectedAccount && (
            <motion.div
              key="step3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="card import-review-card"
            >
              <div className="import-review-summary">
                <span>{newCount} new</span>
                <span>
                  {duplicateCount} duplicate{duplicateCount === 1 ? "" : "s"} (skipped)
                </span>
                {errorCount > 0 && <span className="negative">{errorCount} couldn't be parsed</span>}
              </div>
              <div className="import-review-table-wrap">
                <CsvReviewTable
                  rows={rows}
                  categories={categories}
                  currency={selectedAccount.currency}
                  onToggleSelected={handleToggleSelected}
                  onCategoryChange={handleCategoryChange}
                />
              </div>
              <div className="transaction-form-actions">
                <button
                  type="button"
                  onClick={() => void handleCommit()}
                  disabled={importing || newCount === 0}
                  title={!importing && newCount === 0 ? "Select at least one row to import" : undefined}
                >
                  {importing ? "Importing…" : `Commit import (${newCount})`}
                </button>
                <button type="button" onClick={() => goToStep(1)}>
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {accountPickerOpen && (
        <AccountPickerModal
          title="Import into"
          accounts={accounts}
          excludeId={null}
          onSelect={(id) => {
            setAccountId(id);
            setAccountPickerOpen(false);
          }}
          onClose={() => setAccountPickerOpen(false)}
        />
      )}
    </>
  );
}
