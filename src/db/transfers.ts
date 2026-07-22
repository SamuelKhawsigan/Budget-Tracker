import type Database from "@tauri-apps/plugin-sql";

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
