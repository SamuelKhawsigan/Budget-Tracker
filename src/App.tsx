import { useEffect, useState } from "react";
import type Database from "@tauri-apps/plugin-sql";
import { getDb } from "./db";
import { ThemeProvider } from "./lib/ThemeContext";
import { Sidebar, type ViewName } from "./components/Sidebar";
import { DashboardPage } from "./pages/DashboardPage";
import { AccountsPage } from "./pages/AccountsPage";
import { TransactionsPage } from "./pages/TransactionsPage";
import { CategoriesPage } from "./pages/CategoriesPage";
import { PayeesPage } from "./pages/PayeesPage";
import { PayeeTransactionsPage } from "./pages/PayeeTransactionsPage";
import { TransferPage } from "./pages/TransferPage";
import { BudgetsPage } from "./pages/BudgetsPage";
import { SavingsPage } from "./pages/SavingsPage";
import { ImportPage } from "./pages/ImportPage";
import { SettingsPage } from "./pages/SettingsPage";
import "./App.css";

type View =
  | { name: "dashboard" }
  | { name: "accounts" }
  | { name: "transactions"; accountId: number }
  | { name: "categories" }
  | { name: "payees" }
  | { name: "payee-transactions"; payeeId: number }
  | { name: "transfer" }
  | { name: "budgets" }
  | { name: "savings" }
  | { name: "import" }
  | { name: "settings" };

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

  // Drill-through views ("transactions" into one account's ledger,
  // "payee-transactions" into one payee's) aren't their own nav items —
  // they're reached via Accounts/Payees, so those stay marked active.
  const activeView: ViewName =
    view.name === "transactions" ? "accounts" : view.name === "payee-transactions" ? "payees" : view.name;

  function handleNavigate(name: ViewName) {
    // Safe: ViewName is every View variant except the drill-through ones
    // above, neither of which is reachable from the sidebar, so { name }
    // alone always matches here.
    setView({ name } as View);
  }

  return (
    <ThemeProvider db={db}>
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
          {view.name === "payees" && (
            <PayeesPage
              db={db}
              onSelectPayee={(payeeId) => setView({ name: "payee-transactions", payeeId })}
            />
          )}
          {view.name === "payee-transactions" && (
            <PayeeTransactionsPage
              db={db}
              payeeId={view.payeeId}
              onBack={() => setView({ name: "payees" })}
            />
          )}
          {view.name === "transfer" && <TransferPage db={db} />}
          {view.name === "budgets" && <BudgetsPage db={db} />}
          {view.name === "savings" && <SavingsPage db={db} />}
          {view.name === "import" && <ImportPage db={db} />}
          {view.name === "settings" && <SettingsPage db={db} />}
        </main>
      </div>
    </ThemeProvider>
  );
}

export default App;
