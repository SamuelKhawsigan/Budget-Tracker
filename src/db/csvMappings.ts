import type Database from "@tauri-apps/plugin-sql";
import { getSetting, setSetting } from "./settings";

export interface CsvMapping {
  hasHeader: boolean;
  dateColumn: number;
  amountColumn: number;
  descriptionColumn: number;
  notesColumn: number | null;
}

const SETTINGS_KEY = "csv_import_mappings";

// Saved bank column-mapping profiles live in settings as a single JSON blob
// keyed by profile name, so re-importing the same bank is picking a saved
// name rather than re-mapping columns every time.
export async function listCsvMappings(db: Database): Promise<Record<string, CsvMapping>> {
  const raw = await getSetting(db, SETTINGS_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, CsvMapping>;
  } catch {
    return {};
  }
}

export async function saveCsvMapping(
  db: Database,
  profileName: string,
  mapping: CsvMapping,
): Promise<void> {
  const existing = await listCsvMappings(db);
  existing[profileName] = mapping;
  await setSetting(db, SETTINGS_KEY, JSON.stringify(existing));
}

export async function deleteCsvMapping(db: Database, profileName: string): Promise<void> {
  const existing = await listCsvMappings(db);
  delete existing[profileName];
  await setSetting(db, SETTINGS_KEY, JSON.stringify(existing));
}

export async function renameCsvMapping(
  db: Database,
  oldName: string,
  newName: string,
): Promise<void> {
  const existing = await listCsvMappings(db);
  if (!(oldName in existing) || oldName === newName) return;
  const { [oldName]: mapping, ...rest } = existing;
  rest[newName] = mapping;
  await setSetting(db, SETTINGS_KEY, JSON.stringify(rest));
}
