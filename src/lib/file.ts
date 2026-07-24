import { open, save } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";

export interface PickedFile {
  path: string;
  text: string;
}

export async function pickAndReadCsv(): Promise<PickedFile | null> {
  const path = await open({
    multiple: false,
    filters: [{ name: "CSV", extensions: ["csv"] }],
  });
  if (!path || Array.isArray(path)) {
    return null;
  }
  const text = await invoke<string>("read_text_file", { path });
  return { path, text };
}

// Returns the chosen destination path, or null if the user cancelled the
// save dialog, so callers can distinguish "cancelled" from "failed".
export async function backupDatabase(): Promise<string | null> {
  const today = new Date().toISOString().slice(0, 10);
  const destination = await save({
    defaultPath: `sweep-backup-${today}.db`,
    filters: [{ name: "SQLite database", extensions: ["db"] }],
  });
  if (!destination) return null;
  await invoke("backup_database", { destination });
  return destination;
}
