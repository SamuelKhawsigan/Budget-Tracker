import { useEffect, useState } from "react";
import type Database from "@tauri-apps/plugin-sql";
import { getDb } from "./db";
import { AccountsPage } from "./pages/AccountsPage";
import { TransactionsPage } from "./pages/TransactionsPage";
import { CategoriesPage } from "./pages/CategoriesPage";
import { PayeesPage } from "./pages/PayeesPage";
import "./App.css";

type View =
  | { name: "accounts" }
  | { name: "transactions"; accountId: number }
  | { name: "categories" }
  | { name: "payees" };

function App() {
  const [db, setDb] = useState<Database | null>(null);
  const [dbError, setDbError] = useState<string | null>(null);
  const [view, setView] = useState<View>({ name: "accounts" });

  useEffect(() => {
    getDb()
      .then((database) => setDb(database))
      .catch((e) => setDbError(e instanceof Error ? e.message : String(e)));
  }, []);

  if (dbError) {
    return (
      <main className="container">
        <p className="form-error">{dbError}</p>
      </main>
    );
  }

  if (!db) {
    return (
      <main className="container">
        <p>Loading...</p>
      </main>
    );
  }

  const onAccountsTab = view.name === "accounts" || view.name === "transactions";

  return (
    <main className="container">
      <nav className="main-nav">
        <button
          type="button"
          className={onAccountsTab ? "active" : undefined}
          onClick={() => setView({ name: "accounts" })}
        >
          Accounts
        </button>
        <button
          type="button"
          className={view.name === "categories" ? "active" : undefined}
          onClick={() => setView({ name: "categories" })}
        >
          Categories
        </button>
        <button
          type="button"
          className={view.name === "payees" ? "active" : undefined}
          onClick={() => setView({ name: "payees" })}
        >
          Payees
        </button>
      </nav>

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
    </main>
  );
}

export default App;
