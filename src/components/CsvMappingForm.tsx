import { useState } from "react";
import type { CsvMapping } from "../db/csvMappings";

interface CsvMappingFormProps {
  firstRow: string[];
  secondRow: string[] | null;
  existingProfiles: Record<string, CsvMapping>;
  suggestedProfileName: string;
  onContinue: (profileName: string, mapping: CsvMapping) => void;
}

export function CsvMappingForm({
  firstRow,
  secondRow,
  existingProfiles,
  suggestedProfileName,
  onContinue,
}: CsvMappingFormProps) {
  const columnCount = firstRow.length;
  const profileNames = Object.keys(existingProfiles);

  const [profileName, setProfileName] = useState(suggestedProfileName);
  const [hasHeader, setHasHeader] = useState(true);
  const [dateColumn, setDateColumn] = useState(0);
  const [amountColumn, setAmountColumn] = useState(Math.min(1, columnCount - 1));
  const [descriptionColumn, setDescriptionColumn] = useState(Math.min(2, columnCount - 1));
  const [notesColumn, setNotesColumn] = useState<number | "">("");
  const [error, setError] = useState<string | null>(null);

  function columnLabel(i: number): string {
    if (hasHeader && firstRow[i]) return firstRow[i];
    return `Column ${i + 1}`;
  }

  function optionLabel(i: number): string {
    const sampleRow = hasHeader ? secondRow : firstRow;
    const sample = sampleRow?.[i];
    const label = columnLabel(i);
    return sample ? `${label} (e.g. "${sample}")` : label;
  }

  function applyProfile(name: string) {
    const profile = existingProfiles[name];
    if (!profile) return;
    setProfileName(name);
    setHasHeader(profile.hasHeader);
    setDateColumn(profile.dateColumn);
    setAmountColumn(profile.amountColumn);
    setDescriptionColumn(profile.descriptionColumn);
    setNotesColumn(profile.notesColumn ?? "");
  }

  function handleContinue() {
    if (!profileName.trim()) {
      setError("Give this mapping a name (e.g. the bank's name)");
      return;
    }
    setError(null);
    onContinue(profileName.trim(), {
      hasHeader,
      dateColumn,
      amountColumn,
      descriptionColumn,
      notesColumn: notesColumn === "" ? null : notesColumn,
    });
  }

  const columnIndexes = Array.from({ length: columnCount }, (_, i) => i);

  return (
    <div className="inline-form csv-mapping-form">
      <h2>Map columns</h2>

      {error && <p className="form-error">{error}</p>}

      {profileNames.length > 0 && (
        <label>
          Saved mapping
          <select defaultValue="" onChange={(e) => e.currentTarget.value && applyProfile(e.currentTarget.value)}>
            <option value="">Choose a saved mapping…</option>
            {profileNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
      )}

      <label>
        Mapping name
        <input
          value={profileName}
          onChange={(e) => setProfileName(e.currentTarget.value)}
          placeholder="e.g. Maybank Savings"
        />
      </label>

      <label className="show-archived">
        <input type="checkbox" checked={hasHeader} onChange={(e) => setHasHeader(e.currentTarget.checked)} />
        First row is a header
      </label>

      <label>
        Date column
        <select value={dateColumn} onChange={(e) => setDateColumn(Number(e.currentTarget.value))}>
          {columnIndexes.map((i) => (
            <option key={i} value={i}>
              {optionLabel(i)}
            </option>
          ))}
        </select>
      </label>

      <label>
        Amount column
        <select value={amountColumn} onChange={(e) => setAmountColumn(Number(e.currentTarget.value))}>
          {columnIndexes.map((i) => (
            <option key={i} value={i}>
              {optionLabel(i)}
            </option>
          ))}
        </select>
      </label>

      <label>
        Description (payee) column
        <select value={descriptionColumn} onChange={(e) => setDescriptionColumn(Number(e.currentTarget.value))}>
          {columnIndexes.map((i) => (
            <option key={i} value={i}>
              {optionLabel(i)}
            </option>
          ))}
        </select>
      </label>

      <label>
        Notes column (optional)
        <select
          value={notesColumn}
          onChange={(e) =>
            setNotesColumn(e.currentTarget.value === "" ? "" : Number(e.currentTarget.value))
          }
        >
          <option value="">None</option>
          {columnIndexes.map((i) => (
            <option key={i} value={i}>
              {optionLabel(i)}
            </option>
          ))}
        </select>
      </label>

      <div className="transaction-form-actions">
        <button type="button" onClick={handleContinue}>
          Continue to review
        </button>
      </div>
    </div>
  );
}
