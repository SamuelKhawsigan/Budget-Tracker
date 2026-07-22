// Web Crypto (available in the Tauri webview, a secure context) — no extra
// dependency needed for a SHA-256 hex digest.
export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// account + date + amount + description, per the spec — stable across
// re-imports of the same statement so the unique partial index on
// transactions.import_hash can catch duplicates.
export function importHashInput(
  accountId: number,
  date: string,
  amount: number,
  description: string,
): string {
  return `${accountId}|${date}|${amount}|${description.trim().toLowerCase()}`;
}
