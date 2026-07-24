-- Tracks each CSV import run so the redesigned Import page's "Recent
-- imports" list has something to show — this never existed before; only the
-- resulting transactions (with import_hash) did.
CREATE TABLE import_batches (
  id             INTEGER PRIMARY KEY,
  account_id     INTEGER NOT NULL REFERENCES accounts(id),
  file_name      TEXT    NOT NULL,
  inserted_count INTEGER NOT NULL,
  skipped_count  INTEGER NOT NULL,
  created_at     TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_import_batches_account ON import_batches(account_id);
