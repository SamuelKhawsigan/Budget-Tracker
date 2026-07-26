# Sweep — User Guide

Welcome to Sweep. This guide walks you through the whole app, in the order you'd naturally use it: set up your accounts, log your money, set budgets, and let Sweep move your leftovers into savings at the end of each month.

You don't need to read all of it. If you just want to get going, do Steps 1–3 and you're budgeting.

## The idea in one minute

Sweep is built for money that arrives irregularly rather than as one fixed monthly paycheck.

- You add income whenever it lands and spend against what you actually have.
- You set monthly caps on the categories you want to control.
- At the end of each month, whatever you underspent is swept into your savings account — and Sweep never sweeps more than the real cash you have left.

That's the whole loop. Everything below is just the details.

## First launch

When you open Sweep for the first time, it sets itself up with a starter set of categories (Food, Transport, Housing, and so on) and a default account, so you're not staring at a blank screen.

Everything lives on your own computer. There's no login and nothing goes online.

The menu down the left side is how you move around: Dashboard, Accounts, Transfer, Categories, Payees, Budgets, Savings, Import, with Settings at the bottom.

## Step 1 — Set up your accounts

Go to **Accounts**. This is where your money lives — one card per account.

To add one, use **New account** and fill in:

- **Name** — e.g. "Main", "Maybank Savings", "Cash".
- **Type** — checking, savings, credit, or cash.
- **Currency** — defaults to MYR; change if you need to.
- **Opening balance** — how much is in the account right now.

Add at least one everyday account and one savings account (you'll point the monthly sweep at the savings one later).

Good to know: you never edit an account's balance directly. Sweep works it out from your opening balance plus every transaction — so the number is always correct. To keep history clean, accounts you stop using can be archived (hidden but preserved) rather than deleted.

## Step 2 — Log your income and spending

This is the daily habit, and the fastest way to do it is **Quick add** (bottom of the sidebar).

For each entry:

- Choose Income or Expense.
- Enter the amount and the account it affects.
- Optionally pick a category and payee, and add a note.

Your account balances update instantly. When money comes in — a paycheck, freelance, a gift — log it as income. When you spend, log an expense. That's it.

Tip: keep entry quick and don't worry about categorising everything perfectly in the moment — you can always set the category later. The habit of logging is what matters.

## Categories & payees (the supporting cast)

You can use Sweep with the starter categories forever, but tailoring them makes everything downstream nicer.

**Categories** (in the Categories page) are organised as groups (like "Food") containing categories (like "Groceries" and "Dining Out"). Each can have a colour and an icon, which show up across the app so your spending is easy to scan at a glance. Use the Income / Expense tabs to switch between the two kinds.

**Payees** (in the Payees page) are who you pay or get paid by. The useful trick: give a payee a default category, and whenever you pick that payee, Sweep fills the category in for you — and it uses those defaults to auto-categorise imported transactions too. This is why the Payees page is worth a few minutes: setting defaults now saves you tagging later.

## Step 3 — Set your budgets

Go to **Budgets**. Pick the month with the arrows at the top.

At the top you'll see how much money you have and how much is still unallocated — that's the key number in Sweep: money you've earned but haven't given a job yet.

To set a cap, give a category an amount. Categories with a cap show a health meter:

- **Green** — comfortably under budget.
- **Amber** — getting close to the cap.
- **Terracotta (red)** — over budget.

Categories you haven't budgeted sit quietly to one side until you decide to give them a cap. Budgets don't roll over — each month stands on its own, because unspent money is meant to go to savings, not next month's spending.

### Two ways to budget

In Settings you can choose how budgeting works:

- **Add money as you get it** (default) — you don't pre-plan a whole month. You log income as it arrives and budget against what you actually have. Best for irregular income.
- **Traditional** — you set your monthly caps up front and spend against them. Better if your income is steady.

## Transfers

To move money between your own accounts (say, Main → Savings), use the **Transfer** page: choose the from and to accounts, enter the amount, and record it.

Transfers move both balances correctly and are kept out of your income and spending totals — moving your own money around shouldn't look like earning or spending.

## The monthly sweep (the heart of Sweep)

Go to **Savings**. This is where the app earns its name.

First, choose which account is your savings account (a one-time setting). Then, each month, Sweep shows you three numbers:

1. **Budgeted leftover** — how much of your budget you didn't spend.
2. **Available cash** — the real money you have left (income received minus spending). This is a ceiling.
3. **Projected savings** — what will actually be swept.

The important part: projected savings is always capped at your available cash. If your budgets say you have RM400 left over but you only really have RM300, Sweep sweeps RM300 — never money that doesn't exist. When that cap kicks in, Sweep tells you so.

When you're ready, use **Close month & sweep**. Sweep transfers the leftover into your savings account and records it in your sweep history. You can't accidentally sweep the same month twice, and if you make a mistake there's an Undo.

### Net vs. aggressive saving

In Settings you can pick the sweep rule:

- **Net** (default) — total budgeted minus total spent. Honest to your real cash position.
- **Positive only** — adds up only the categories you came in under, ignoring overspends. Saves more aggressively.

## Importing bank statements

Rather than typing everything, you can import a CSV exported from your bank. Go to **Import** (near Settings at the bottom).

1. **Source** — choose which account you're importing into, then drag your CSV onto the drop zone or browse for it.
2. **Map columns** — tell Sweep which column is the date, the amount, and the description. Every bank exports differently, so you can save the mapping with a name and reuse it next time in one click.
3. **Review & commit** — Sweep shows every row, flags which are new vs. already imported, and lets you set categories before saving. Nothing is added until you confirm.

Duplicates are handled for you: if you import a statement that overlaps a previous one, Sweep recognises the rows you already have and only adds the new ones. Re-importing the same file adds nothing.

Importing also creates payees automatically — which is why setting default categories on your payees pays off.

## Settings

Everything you configure lives in Settings:

- **Budgeting** — budgeting mode (add-as-you-go vs. traditional), sweep rule (net vs. positive), and which account is your savings account.
- **Appearance** — choose a theme (Warm Dark, Parchment, Midnight, Phosphor, Dusk, or Ink — each with light and dark options) and your font style. Pick "match system" to follow your OS.
- **Data** — manage your saved CSV import mappings, and back up / export your data.

## Backups & your data

All of your data is a single file on your own PC. To keep it safe, use **Settings → Data** to export a backup now and then — especially before anything major, or just monthly. Keep the exported copy somewhere separate (another drive, a USB stick, a cloud folder of your choosing). Sweep never does this for you, because Sweep never touches the internet.

## A suggested routine

- **When money comes in:** log it as income (or import your statement).
- **As you spend:** quick-add expenses — a few seconds each.
- **Once a week:** glance at the Dashboard and tidy any uncategorised transactions.
- **At month end:** open Savings, check the projected sweep, and Close month & sweep.

Do that and your savings grow on their own, out of money you'd otherwise have let drift.

## Quick answers

**Do I need an account or internet?** No. Sweep is fully offline and local.

**Where's my data?** In a local database file on your PC. Export a backup from Settings → Data.

**Why can't I edit a balance directly?** Because Sweep calculates it from your transactions, so it's always right. Add a transaction (or adjust the opening balance) instead.

**I deleted something by mistake.** Prefer Archive over Delete for things you might want back — archived items are hidden but preserved. Deleting is permanent, and Sweep will warn you when something has history attached.

**A transfer looks like it's missing from my spending.** That's intentional — transfers between your own accounts aren't spending or income.

**Why did my sweep save less than my leftover?** Because it's clamped to the real cash you had that month. That's the safety feature, working as intended.
