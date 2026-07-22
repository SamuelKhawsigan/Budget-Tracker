import { useEffect, useState } from "react";
import type Database from "@tauri-apps/plugin-sql";
import { listAccounts, type AccountWithBalance } from "../db/accounts";
import { listLeafCategories, type CategoryOption } from "../db/categories";
import { findOrCreatePayee, findPayeesByNames } from "../db/payees";
import { createImportedTransaction, getExistingImportHashes } from "../db/transactions";
import { listCsvMappings, saveCsvMapping, type CsvMapping } from "../db/csvMappings";
import { parseCsv } from "../lib/csv";
import { parseImportAmount, parseImportDate } from "../lib/importParsing";
import { importHashInput, sha256Hex } from "../lib/hash";
import { pickAndReadCsv } from "../lib/file";
import type { ImportCandidateRow } from "../types";
import { CsvMappingForm } from "../components/CsvMappingForm";
import { CsvReviewTable } from "../components/CsvReviewTable";

interface ImportPageProps {
  db: Database;
}

type Step =
  | { name: "pick" }
  | { name: "mapping"; rawRows: string[][]; suggestedProfileName: string }
  | { name: "review" };

export function ImportPage({ db }: ImportPageProps) {
  const [accounts, setAccounts] = useState<AccountWithBalance[]>([]);
  const [accountId, setAccountId] = useState<number | "">("");
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [mappingProfiles, setMappingProfiles] = useState<Record<string, CsvMapping>>({});
  const [step, setStep] = useState<Step>({ name: "pick" });
  const [rows, setRows] = useState<ImportCandidateRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    void listAccounts(db, false).then(setAccounts);
    void listLeafCategories(db).then(setCategories);
    void listCsvMappings(db).then(setMappingProfiles);
  }, [db]);

  async function handlePickFile() {
    if (accountId === "") {
      setError("Choose an account first");
      return;
    }
    setError(null);
    setSuccess(null);
    try {
      const picked = await pickAndReadCsv();
      if (!picked) return; // user cancelled the dialog

      const parsed = parseCsv(picked.text);
      if (parsed.length === 0) {
        setError("That file has no rows");
        return;
      }

      const fileName = picked.path.split(/[\\/]/).pop() ?? "Import";
      const suggestedProfileName = fileName.replace(/\.csv$/i, "");

      setStep({ name: "mapping", rawRows: parsed, suggestedProfileName });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function handleMappingContinue(profileName: string, mapping: CsvMapping) {
    if (step.name !== "mapping" || accountId === "") return;
    setError(null);

    try {
      await saveCsvMapping(db, profileName, mapping);
      setMappingProfiles((prev) => ({ ...prev, [profileName]: mapping }));

      const dataRows = mapping.hasHeader ? step.rawRows.slice(1) : step.rawRows;
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
      setStep({ name: "review" });
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

      setSuccess(`Imported ${inserted} transaction${inserted === 1 ? "" : "s"}. Skipped ${skipped + failed}.`);
      setStep({ name: "pick" });
      setRows([]);
    } finally {
      setImporting(false);
    }
  }

  const selectedAccount = accounts.find((a) => a.id === accountId) ?? null;
  const newCount = rows.filter((r) => r.selected && !r.isDuplicate && !r.parseError).length;
  const duplicateCount = rows.filter((r) => r.isDuplicate).length;
  const errorCount = rows.filter((r) => r.parseError).length;

  return (
    <>
      <h1>Import CSV</h1>

      {error && <p className="form-error">{error}</p>}
      {success && <p className="form-success">{success}</p>}

      {step.name === "pick" && (
        <div className="inline-form">
          <h2>Choose file</h2>
          <label>
            Account
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.currentTarget.value === "" ? "" : Number(e.currentTarget.value))}
            >
              <option value="">Choose an account</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>
          <button type="button" onClick={handlePickFile} disabled={accountId === ""}>
            Choose CSV file…
          </button>
        </div>
      )}

      {step.name === "mapping" && (
        <CsvMappingForm
          firstRow={step.rawRows[0]}
          secondRow={step.rawRows[1] ?? null}
          existingProfiles={mappingProfiles}
          suggestedProfileName={step.suggestedProfileName}
          onContinue={handleMappingContinue}
        />
      )}

      {step.name === "review" && selectedAccount && (
        <>
          <p className="cash-summary">
            <span>{newCount} new</span>
            <span>
              {duplicateCount} duplicate{duplicateCount === 1 ? "" : "s"} (skipped)
            </span>
            {errorCount > 0 && <span className="negative">{errorCount} couldn't be parsed</span>}
          </p>
          <CsvReviewTable
            rows={rows}
            categories={categories}
            currency={selectedAccount.currency}
            onToggleSelected={handleToggleSelected}
            onCategoryChange={handleCategoryChange}
          />
          <div className="transaction-form-actions">
            <button type="button" onClick={handleCommit} disabled={importing || newCount === 0}>
              {importing ? "Importing…" : `Commit import (${newCount})`}
            </button>
            <button type="button" onClick={() => setStep({ name: "pick" })}>
              Cancel
            </button>
          </div>
        </>
      )}
    </>
  );
}
