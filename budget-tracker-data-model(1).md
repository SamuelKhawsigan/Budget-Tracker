# Budget Tracker — Data Model Spec

Local SQLite database for a single-user, manual-entry + CSV-import budget tracker
(Tauri shell, React frontend). This is the schema and the reasoning behind it —
hand it to Claude Code as the source of truth for the data layer.

---

## Core design decisions (read these first)

These are the rules the whole schema depends on. Follow them everywhere.

1. **Money is stored as integers in minor units (sen/cents), never floats.**
   `12.50` is stored as `1250`. Floating-point rounding errors are unacceptable in
   a finance app. Convert to a decimal only for display.

2. **Amounts are signed; account balances are derived, never stored.**
   Income is a positive `amount`, expense is negative. An account's balance is
   `opening_balance + SUM(amount)` over its transactions — computed on the fly (or
   cached later for speed), so a stored running total can never drift out of sync.

3. **Dates are ISO text** (`'YYYY-MM-DD'`). SQLite has no date type; ISO strings
   sort correctly and stay human-readable.

4. **Category is optional on a transaction.** Fast entry first, categorize later —
   `category_id` is nullable so nothing blocks a quick add.

5. **Archive, don't delete.** Accounts, categories and payees use an `is_archived`
   flag instead of hard deletes, so historical transactions never orphan.

6. **Foreign keys are enforced.** Run `PRAGMA foreign_keys = ON;` on every
   connection (SQLite defaults it off).

---

## Schema

```sql
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
```

---

## Two things worth understanding

**Transfers** are represented as **two linked rows**: the outgoing leg in the source
account (negative `amount`) and the incoming leg in the destination account
(positive `amount`), both with `type = 'transfer'` and their `transfer_id` pointing
at each other. This keeps every account's balance correct from a simple `SUM(amount)`.
Important: **income/expense reports must exclude `type = 'transfer'`**, or moving your
own money looks like spending.

**CSV import** stays idempotent via `import_hash` — a hash of the row's key fields
(account + date + amount + description). The unique partial index means re-importing
the same statement can't create duplicates. A small mapping layer per bank turns each
bank's CSV columns into these fields.

---

## Budgeting method: irregular income + sweep to savings

Income doesn't arrive as one fixed monthly allowance — it comes in irregularly through
the month — so the app supports **two modes**, stored in `settings.budgeting_mode`:

- **`available` — add money as you get it.** You don't preset a whole month's budget.
  Each time income lands you log it (just a positive transaction) and spend against the
  real running balance. This suits irregular income best: you only ever budget money
  you actually have.
- **`fixed` — traditional.** You set monthly category caps up front and spend against
  them regardless of when income arrives. Predictable if your income evens out.

Either mode, budgets stay simple monthly caps with **no rollover inside a category** —
leftover goes to savings, never into next month's grocery budget.

**The sweep.** At month close, the leftover is transferred into your savings account
(the usual linked-pair transfer; `savings_sweeps` records it, tied to the budget
month). Two knobs, both in `settings`:

- `sweep_rule = 'net'` (default) — total budgeted minus total spent — vs `'positive'`
  (sum only the categories you came in under; saves more aggressively).
- The swept amount is always **clamped to actual cash left** (income received − spent
  this month). This clamp is what makes irregular income safe: in a lean month you can
  only sweep money that genuinely exists, so the savings transfer never pushes your
  checking balance somewhere it shouldn't go.

Default: **net, clamped to real cash** — it can never move money you didn't actually
have.

---

## Built to extend

The core above is the MVP. These slot in cleanly later without reshaping anything:

- **Tags** (many-to-many): a `tags` table + `transaction_tags(transaction_id, tag_id)`
  join, for cross-category labels like `#reimbursable`.
- **Auto-categorization rules**: `rules(match_pattern, payee_id, category_id)` to tag
  imported transactions automatically.
- **Recurring transactions**: `recurring_rules` holding a transaction template +
  frequency + next-run date; a background check materializes due ones.
- **Savings goals**: `goals(name, target_amount, target_date, account_id)` — let the
  monthly sweep target a specific goal (or split across several) instead of one pot.
- **Net worth over time**: derivable from account balances; add periodic snapshots
  only if you want fast historical charts.

---

## Environment & toolchain

Build **natively on Windows** — the target is a Windows `.exe`, and Tauri compiles a
separate native binary per OS, so a WSL/Linux build produces a *Linux* binary, not the
app you want (cross-compiling Linux→Windows is impractical). Run **Claude Code natively
on Windows** too (it no longer requires WSL), so its build/run/test loop and the target
platform are the same place.

One-time setup on Windows:

- **Rust** via rustup — MSVC toolchain (not GNU).
- **Node.js** (LTS).
- **Visual Studio C++ Build Tools** — the MSVC linker Rust needs.
- **WebView2** runtime — already present on Windows 11.
- **Git for Windows** — so Claude Code's bash tool works.

Keep the project on the Windows filesystem (e.g. `C:\dev\budget-tracker`), not under
`\\wsl$\` or `/mnt/c`, to avoid cross-filesystem slowness and path confusion. SQLite
goes through `tauri-plugin-sql` (migrations + queries from TS), as in Phase 0.

---

## MVP build order (for Claude Code)

Build in vertical slices — each phase leaves a working, testable app and the next one
builds on it. Don't jump ahead to import or charts before the data they rely on exists.

**Phase 0 — Scaffold & plumbing.** Tauri + React + Vite project; Tailwind + shadcn/ui.
Wire SQLite via `tauri-plugin-sql` (simplest path — run migrations and queries from
TS, which is where Claude Code is strongest). Create all core tables in the first
migration with `PRAGMA foreign_keys = ON`, and **seed** a default account, a starter
category set, and the `settings` rows (`budgeting_mode='available'`, `sweep_rule='net'`)
so the app is usable from the first run. Build two things before any UI: the
**money helpers** (integer minor-units ↔ display) and the **derived-balance function**
(`opening_balance + SUM(amount)`). Everything depends on these — retrofitting them later
is painful, so nail them (with tests) up front.

**Phase 1 — Accounts.** CRUD + archive, with the derived balance shown. Smallest real
slice; everything hangs off it.

**Phase 2 — Transactions (the core loop).** Add/edit/delete income & expense with
signed amounts, optional category/payee. Per-account list with search/filter, and a
keyboard-first quick-add — this is the daily loop, so make it fast even in v1. Balances
should update live; verify the math here.

**Phase 3 — Categories & payees.** Full category management (groups + leaves,
color/icon) and payees with a default category that auto-fills on entry. (Phase 2 runs
against the seeded set until this lands.)

**Phase 4 — Transfers.** Entry that writes the linked pair; confirm balances are right
and income/expense reports exclude `type='transfer'`.

**Phase 5 — Budgets.** Monthly caps per category + a budget-vs-actual view with
color-coded health. Honour `budgeting_mode` (`available` default).

**Phase 6 — Savings sweep.** Designate the savings account (settings); at month close
compute net leftover **clamped to actual cash**, write the transfer + `savings_sweeps`
row. Add the live "projected savings this month" number for the immediate feel.

**Phase 7 — CSV import.** File pick → per-bank column mapping → dedupe via
`import_hash` → review/categorize → commit. Meatier, and it needs a stable schema and
somewhere to import into, so it comes after the core loop.

**Phase 8 — Dashboard & charts.** The at-a-glance view: month summary, budget health,
spend-by-category, trends. This is where the "stunning" budget goes — do it once real
data flows so you're designing against reality, not placeholders.

**Phase 9 — Polish.** Frameless window + custom titlebar, dark mode, empty/onboarding
states, keyboard shortcuts, backup/export. Last, so you're not re-polishing churning UI.

**Later (post-MVP):** tags, auto-categorization rules, recurring transactions, savings
goals, net-worth history — all slot into the "built to extend" shapes above.
