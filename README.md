# Sweep

A local-first personal budget tracker for Windows — built for money that arrives whenever it arrives.

Sweep is a desktop budgeting app for people who don't get one fixed paycheck a month. You log money as it comes in, spend against what you actually have, and at the end of each month whatever you didn't spend is swept into savings — automatically, and never more than the cash you really have left.

Everything lives on your own machine. No account, no cloud, no sign-up.

**Status:** v0.1.0 — first public release.

## Why Sweep

Most budget apps assume a steady monthly salary and let you "budget" money you haven't earned yet. Sweep is built the other way around:

- **You only budget money you actually have.** Add income whenever it lands; spend against your real balance.
- **Leftovers become savings, not next month's spending.** At month close, the unspent remainder is transferred to your savings account.
- **The sweep can never move money you don't have.** It's always clamped to your real available cash, so a lean month simply saves less — never phantom money.
- **Your money math is exact.** Every value is stored as whole minor units (sen/cents), so there's no floating-point rounding drift.

## Features

- **Accounts** — checking, savings, credit, cash. Balances are derived from your transactions, so they can never fall out of sync.
- **Fast transaction entry** — a keyboard-friendly quick-add for income and expenses.
- **Transfers** — move money between your own accounts; correctly excluded from income/spending totals.
- **Categories & payees** — two-level category groups with icons and colours; payees that remember a default category to speed up entry.
- **Budgets** — simple monthly caps with at-a-glance health (under / near / over), and a clear view of what's still unallocated.
- **The monthly sweep** — the heart of the app: leftover money swept to savings, clamped to real cash, with a full sweep history.
- **CSV import** — bring in bank statements with per-bank column mapping and automatic duplicate detection, so re-importing overlapping dates never creates duplicates.
- **Themes** — six palettes (Warm Dark, Parchment, Midnight, Phosphor, Dusk, Ink) plus font options, in Settings.
- **Private by design** — all data stays in a local file on your PC.

## Screenshots

Add a few screenshots here before release — the Dashboard, Accounts, and the Savings sweep are the ones that sell it.

<!-- ![Dashboard](docs/screenshots/dashboard.png) -->
<!-- ![Accounts](docs/screenshots/accounts.png) -->
<!-- ![Sweep](docs/screenshots/savings.png) -->

## Download & install (Windows)

1. Go to the [Releases](https://github.com/SamuelKhawsigan/Sweep/releases) page and download the latest installer (`Sweep_0.1.0_x64-setup.exe` or the `.msi`).
2. Run it. Windows will likely show a "Windows protected your PC" warning — this is expected for new apps that aren't code-signed (a signing certificate costs money and isn't worth it for a v0.1 hobby release). To continue: click **More info** → **Run anyway**.
3. Launch Sweep. On first run it sets itself up with a starter set of categories and a default account so you're not staring at an empty screen.

Not sure what to do next? See the [User Guide](docs/USER_GUIDE.md) — it walks you through the app from first launch to your first sweep.

## Your data & privacy

Sweep stores everything in a single local SQLite database on your PC — there are no online accounts and nothing is ever uploaded. You can back up or export your data at any time from **Settings → Data**.

Because the data is a single file, backing it up is as simple as keeping a copy of that export somewhere safe.

## Building from source

Sweep is a [Tauri](https://tauri.app) app: a Rust core with a React + TypeScript frontend and a local SQLite database.

Prerequisites (Windows):

- [Rust](https://rustup.rs) (installs the MSVC toolchain by default)
- [Node.js](https://nodejs.org) (LTS)
- [Visual Studio C++ Build Tools](https://visualstudio.microsoft.com/downloads/) — the "Desktop development with C++" workload
- WebView2 runtime (already present on Windows 11)
- [Git for Windows](https://git-scm.com/download/win)

Run in development:

```bash
npm install
npm run tauri dev
```

Build a release installer:

```bash
npm run tauri build
```

The installers are written to `src-tauri/target/release/bundle/`.

## Tech stack

- **Shell:** Tauri 2 (Rust)
- **Frontend:** React + TypeScript + Vite
- **Database:** local SQLite (via `tauri-plugin-sql`)
- **Charts:** Recharts
- **Motion:** Framer Motion
- **Type:** Space Grotesk (display), JetBrains Mono (figures), Inter (body)

## License

Choose a license before you publish. For a personal open-source project, MIT is a common, permissive choice — it lets people use and modify the code freely while keeping things simple. Add a `LICENSE` file and update this section once you decide.

## Feedback

Found a bug or have an idea? Open an issue on the repo. Sweep is a personal project, so no promises on turnaround — but it's genuinely useful to hear where it breaks.
