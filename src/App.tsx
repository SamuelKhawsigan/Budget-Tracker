import { useEffect, useState } from "react";
import type Database from "@tauri-apps/plugin-sql";
import { AnimatePresence } from "framer-motion";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { getDb } from "./db";
import { ThemeProvider } from "./lib/ThemeContext";
import { Sidebar, type ViewName } from "./components/Sidebar";
import { QuickAddTransactionModal } from "./components/QuickAddTransactionModal";
import { SplashScreen } from "./components/SplashScreen";
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
  | { name: "import"; accountId?: number }
  | { name: "settings" };

// Never disappears before this, even on an instant local DB connection — a
// splash that flashes for one frame reads as a glitch, not a boot sequence.
const MIN_SPLASH_MS = 600;

function App() {
  const [db, setDb] = useState<Database | null>(null);
  const [bootError, setBootError] = useState<string | null>(null);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const [bootAttempt, setBootAttempt] = useState(0);
  const [view, setView] = useState<View>({ name: "dashboard" });
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [dashboardRefreshKey, setDashboardRefreshKey] = useState(0);

  useEffect(() => {
    setBootError(null);
    getDb()
      .then((database) => setDb(database))
      .catch((e) => setBootError(e instanceof Error ? e.message : String(e)));
  }, [bootAttempt]);

  useEffect(() => {
    setMinTimeElapsed(false);
    const timer = setTimeout(() => setMinTimeElapsed(true), MIN_SPLASH_MS);
    return () => clearTimeout(timer);
  }, [bootAttempt]);

  function handleRetry() {
    setDb(null);
    setBootAttempt((n) => n + 1);
  }

  function handleQuit() {
    void getCurrentWindow().close();
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

  const showSplash = !db || !minTimeElapsed;

  return (
    <>
      <AnimatePresence>
        {showSplash && (
          <SplashScreen
            status={bootError ? "error" : "loading"}
            errorMessage={bootError}
            onRetry={handleRetry}
            onQuit={handleQuit}
          />
        )}
      </AnimatePresence>

      {db && (
        <ThemeProvider db={db}>
          <div className="app-shell">
            <Sidebar
              activeView={activeView}
              onNavigate={handleNavigate}
              onQuickAdd={() => setQuickAddOpen(true)}
            />

            <main className="app-content">
              {view.name === "dashboard" && (
                <DashboardPage
                  key={dashboardRefreshKey}
                  db={db}
                  onQuickAdd={() => setQuickAddOpen(true)}
                />
              )}
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
                  onImport={() => setView({ name: "import", accountId: view.accountId })}
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
              {view.name === "import" && (
                <ImportPage
                  db={db}
                  preselectedAccountId={view.accountId}
                  onNavigateToAccounts={() => setView({ name: "accounts" })}
                  onNavigateToSettings={() => setView({ name: "settings" })}
                />
              )}
              {view.name === "settings" && <SettingsPage db={db} />}
            </main>

            {quickAddOpen && (
              <QuickAddTransactionModal
                db={db}
                onClose={() => setQuickAddOpen(false)}
                onCreated={() => setDashboardRefreshKey((n) => n + 1)}
              />
            )}
          </div>
        </ThemeProvider>
      )}
    </>
  );
}

export default App;
