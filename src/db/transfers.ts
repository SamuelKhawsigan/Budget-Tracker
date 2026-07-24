import type Database from "@tauri-apps/plugin-sql";

export interface TransferRecord {
  id: number; // the outgoing leg's id — what deleteTransfer expects
  date: string;
  amount: number; // positive minor units
  notes: string | null;
  fromAccountId: number;
  fromAccountName: string;
  toAccountId: number;
  toAccountName: string;
  isSweep: boolean;
}

// One row per transfer (matches only the outgoing/negative leg, then joins
// to its partner via transfer_id) so the two linked transaction rows never
// show up as two separate history entries. savings_sweeps.transfer_id points
// at the outgoing leg, so a LEFT JOIN there tells manual transfers apart from
// sweeps without duplicating any sweep-specific data here.
export async function listTransfers(db: Database, limit = 100): Promise<TransferRecord[]> {
  const rows = await db.select<
    {
      id: number;
      date: string;
      amount: number;
      notes: string | null;
      from_account_id: number;
      from_account_name: string;
      to_account_id: number;
      to_account_name: string;
      is_sweep: number;
    }[]
  >(
    `SELECT
       t.id AS id,
       t.date AS date,
       ABS(t.amount) AS amount,
       t.notes AS notes,
       t.account_id AS from_account_id,
       fa.name AS from_account_name,
       partner.account_id AS to_account_id,
       ta.name AS to_account_name,
       CASE WHEN ss.id IS NOT NULL THEN 1 ELSE 0 END AS is_sweep
     FROM transactions t
     JOIN transactions partner ON partner.id = t.transfer_id
     JOIN accounts fa ON fa.id = t.account_id
     JOIN accounts ta ON ta.id = partner.account_id
     LEFT JOIN savings_sweeps ss ON ss.transfer_id = t.id
     WHERE t.type = 'transfer' AND t.amount < 0
     ORDER BY t.date DESC, t.id DESC
     LIMIT ?`,
    [limit],
  );

  return rows.map((r) => ({
    id: r.id,
    date: r.date,
    amount: r.amount,
    notes: r.notes,
    fromAccountId: r.from_account_id,
    fromAccountName: r.from_account_name,
    toAccountId: r.to_account_id,
    toAccountName: r.to_account_name,
    isSweep: r.is_sweep === 1,
  }));
}

export interface TransferInput {
  fromAccountId: number;
  toAccountId: number;
  date: string;
  amount: number; // positive minor units — the magnitude being moved
  notes: string | null;
}

// Transfers are two linked rows: the outgoing leg (negative amount) in the
// source account and the incoming leg (positive amount) in the destination
// account, both type='transfer', each pointing at the other via transfer_id.
// This keeps every account's balance correct from a plain SUM(amount).
// listTransactions() always excludes type='transfer', so these never show up
// as income or spending. Returns the outgoing leg's id — savings_sweeps.transfer_id
// points at it as "the transfer" for a sweep.
export async function createTransfer(db: Database, input: TransferInput): Promise<number> {
  const magnitude = Math.abs(input.amount);

  const outgoing = await db.execute(
    `INSERT INTO transactions (account_id, date, amount, type, notes)
     VALUES (?, ?, ?, 'transfer', ?)`,
    [input.fromAccountId, input.date, -magnitude, input.notes],
  );
  if (outgoing.lastInsertId == null) {
    throw new Error("Insert did not return a row id");
  }
  const outgoingId = outgoing.lastInsertId;

  const incoming = await db.execute(
    `INSERT INTO transactions (account_id, date, amount, type, notes, transfer_id)
     VALUES (?, ?, ?, 'transfer', ?, ?)`,
    [input.toAccountId, input.date, magnitude, input.notes, outgoingId],
  );
  if (incoming.lastInsertId == null) {
    throw new Error("Insert did not return a row id");
  }

  await db.execute("UPDATE transactions SET transfer_id = ? WHERE id = ?", [
    incoming.lastInsertId,
    outgoingId,
  ]);

  return outgoingId;
}

// Deletes a transfer given ONE of its legs, always removing BOTH legs so a
// half-transfer can never be left behind. If the transfer happened to back a
// savings sweep, that savings_sweeps row is removed too (the sweep is undone).
export async function deleteTransfer(db: Database, legId: number): Promise<void> {
  const row = await db.select<{ transfer_id: number | null }[]>(
    "SELECT transfer_id FROM transactions WHERE id = ?",
    [legId],
  );
  if (row.length === 0) return;

  const partnerId = row[0].transfer_id;
  const legs = partnerId != null ? [legId, partnerId] : [legId];
  const ph = legs.map(() => "?").join(",");

  await db.execute(`UPDATE transactions SET transfer_id = NULL WHERE id IN (${ph})`, legs);
  await db.execute(`DELETE FROM savings_sweeps WHERE transfer_id IN (${ph})`, legs);
  await db.execute(`DELETE FROM transactions WHERE id IN (${ph})`, legs);
}
