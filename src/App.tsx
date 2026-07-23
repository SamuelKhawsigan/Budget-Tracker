import { useEffect, useState } from "react";
import type Database from "@tauri-apps/plugin-sql";
import { getDb } from "./db";
import { Sidebar, type ViewName } from "./components/Sidebar";
import { DashboardPage } from "./pages/DashboardPage";
import { AccountsPage } from "./pages/AccountsPage";
import { TransactionsPage } from "./pages/TransactionsPage";
import { CategoriesPage } from "./pages/CategoriesPage";
import { PayeesPage } from "./pages/PayeesPage";
import { TransferPage } from "./pages/TransferPage";
import { BudgetsPage } from "./pages/BudgetsPage";
import { SavingsPage } from "./pages/SavingsPage";
import { ImportPage } from "./pages/ImportPage";
import "./App.css";

type View =
  | { name: "dashboard" }
  | { name: "accounts" }
  | { name: "transactions"; accountId: number }
  | { name: "categories" }
  | { name: "payees" }
  | { name: "transfer" }
  | { name: "budgets" }
  | { name: "savings" }
  | { name: "import" };

function App() {
  const [db, setDb] = useState<Database | null>(null);
  const [dbError, setDbError] = useState<string | null>(null);
  const [view, setView] = useState<View>({ name: "dashboard" });

  useEffect(() => {
    getDb()
      .then((database) => setDb(database))
      .catch((e) => setDbError(e instanceof Error ? e.message : String(e)));
  }, []);

  if (dbError) {
    return (
      <div className="app-shell app-shell-unready">
        <p className="form-error">{dbError}</p>
      </div>
    );
  }

  if (!db) {
    return (
      <div className="app-shell app-shell-unready">
        <p className="empty-state">Loading…</p>
      </div>
    );
  }

  // "transactions" (drilling into one account's ledger) isn't its own nav
  // item — it's reached via Accounts, so it keeps Accounts marked active.
  const activeView: ViewName = view.name === "transactions" ? "accounts" : view.name;

  function handleNavigate(name: ViewName) {
    // Safe: ViewName is every View variant except "transactions", the only
    // one that needs an extra field, so { name } alone always matches.
    setView({ name } as View);
  }

  return (
    <div className="app-shell">
      <Sidebar
        activeView={activeView}
        onNavigate={handleNavigate}
        onQuickAdd={() => setView({ name: "accounts" })}
      />

      <main className="app-content">
        {view.name === "dashboard" && <DashboardPage db={db} />}
        {view.name === "accounts" && (
          <AccountsPage
            db={db}
            onSelectAccount={(accountId) => setView({ name: "transactions", accountId })}
          />
        )}
        {view.name === "transactions" && (
          <TransactionsPage
            db={db}
            accountId={view.accountId}
            onBack={() => setView({ name: "accounts" })}
          />
        )}
        {view.name === "categories" && <CategoriesPage db={db} />}
        {view.name === "payees" && <PayeesPage db={db} />}
        {view.name === "transfer" && <TransferPage db={db} />}
        {view.name === "budgets" && <BudgetsPage db={db} />}
        {view.name === "savings" && <SavingsPage db={db} />}
        {view.name === "import" && <ImportPage db={db} />}
      </main>
    </div>
  );
}

export default App;
