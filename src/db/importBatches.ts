import type Database from "@tauri-apps/plugin-sql";

export interface ImportBatch {
  id: number;
  account_id: number;
  account_name: string;
  file_name: string;
  inserted_count: number;
  skipped_count: number;
  created_at: string;
}

export async function recordImportBatch(
  db: Database,
  accountId: number,
  fileName: string,
  insertedCount: number,
  skippedCount: number,
): Promise<void> {
  await db.execute(
    "INSERT INTO import_batches (account_id, file_name, inserted_count, skipped_count) VALUES (?, ?, ?, ?)",
    [accountId, fileName, insertedCount, skippedCount],
  );
}

// Most recent first — feeds the Import page's "Recent imports" card.
export async function listRecentImportBatches(db: Database, limit = 8): Promise<ImportBatch[]> {
  return db.select<ImportBatch[]>(
    `SELECT ib.id, ib.account_id, a.name as account_name, ib.file_name,
            ib.inserted_count, ib.skipped_count, ib.created_at
     FROM import_batches ib
     JOIN accounts a ON a.id = ib.account_id
     ORDER BY ib.created_at DESC, ib.id DESC
     LIMIT ?`,
    [limit],
  );
}
