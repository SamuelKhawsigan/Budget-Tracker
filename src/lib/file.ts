import { open } from "@tauri-apps/plugin-dialog";
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
