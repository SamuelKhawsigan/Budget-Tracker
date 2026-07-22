-- Phase 0 schema. See budget-tracker-data-model.md for the full design rationale.
-- PRAGMA foreign_keys is a per-connection setting in SQLite, so it is also
-- re-issued by the JS db wrapper (src/db/index.ts) on every connection open.
PRAGMA foreign_keys = ON;

-- Where money lives: bank accounts, cash, credit cards, etc.
CREATE TABLE accounts (
  id              INTEGER PRIMARY KEY,
  name            TEXT    NOT NULL,
  type            TEXT    NOT NULL CHECK (type IN
                    ('checking','savings','credit','cash','investment','other')),
  currency        TEXT    NOT NULL DEFAULT 'MYR',   -- ISO 4217; your default
  opening_balance INTEGER NOT NULL DEFAULT 0,       -- minor units
  is_archived     INTEGER NOT NULL DEFAULT 0,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Two-level categories: a group has parent_id = NULL,
-- a leaf category points at its group. e.g. "Food" > "Groceries".
CREATE TABLE categories (
  id          INTEGER PRIMARY KEY,
  name        TEXT    NOT NULL,
  parent_id   INTEGER REFERENCES categories(id),
  kind        TEXT    NOT NULL CHECK (kind IN ('income','expense')),
  color       TEXT,                                  -- hex, for charts/tags
  icon        TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_archived INTEGER NOT NULL DEFAULT 0
);

-- Merchants / people you pay. Powers autocomplete and auto-categorization.
CREATE TABLE payees (
  id                  INTEGER PRIMARY KEY,
  name                TEXT NOT NULL UNIQUE,
  default_category_id INTEGER REFERENCES categories(id),
  is_archived         INTEGER NOT NULL DEFAULT 0
);

-- The heart of the app. One row per money movement.
CREATE TABLE transactions (
  id          INTEGER PRIMARY KEY,
  account_id  INTEGER NOT NULL REFERENCES accounts(id),
  date        TEXT    NOT NULL,                       -- 'YYYY-MM-DD'
  amount      INTEGER NOT NULL,                       -- minor units, signed
  type        TEXT    NOT NULL CHECK (type IN ('income','expense','transfer')),
  category_id INTEGER REFERENCES categories(id),      -- NULL = uncategorized
  payee_id    INTEGER REFERENCES payees(id),
  notes       TEXT,
  transfer_id INTEGER REFERENCES transactions(id),    -- links the two legs of a transfer
  is_cleared  INTEGER NOT NULL DEFAULT 0,             -- reconciled vs. statement
  import_hash TEXT,                                   -- dedupe key for CSV import
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_tx_account_date ON transactions(account_id, date);
CREATE INDEX idx_tx_category     ON transactions(category_id);
CREATE UNIQUE INDEX idx_tx_import_hash
  ON transactions(import_hash) WHERE import_hash IS NOT NULL;

-- One budgeted limit per category per month.
CREATE TABLE budgets (
  id          INTEGER PRIMARY KEY,
  category_id INTEGER NOT NULL REFERENCES categories(id),
  month       TEXT    NOT NULL,                       -- 'YYYY-MM'
  amount      INTEGER NOT NULL,                       -- planned limit, minor units
  UNIQUE (category_id, month)
);

-- Records each month's sweep of unspent budget into savings.
-- The money movement itself is the linked transfer; this row marks that
-- transfer as a sweep and ties it to the budget month it settles.
CREATE TABLE savings_sweeps (
  id          INTEGER PRIMARY KEY,
  month       TEXT    NOT NULL UNIQUE,              -- 'YYYY-MM' being settled
  amount      INTEGER NOT NULL,                     -- swept to savings, minor units
  transfer_id INTEGER NOT NULL REFERENCES transactions(id),
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Simple key/value app settings. Seeded keys include:
--   budgeting_mode     = 'available' | 'fixed'
--   sweep_rule         = 'net' | 'positive'
--   savings_account_id = '<accounts.id>'
CREATE TABLE settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
