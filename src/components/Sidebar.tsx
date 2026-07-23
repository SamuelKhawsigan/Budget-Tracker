import type { ComponentType } from "react";
import {
  ArrowLeftRight,
  Landmark,
  LayoutDashboard,
  PiggyBank,
  Plus,
  Tags,
  Target,
  Upload,
  Users,
} from "lucide-react";

// Every sidebar destination except drilling into a specific account's
// transactions (reached only via clicking an account row, not from the nav).
export type ViewName =
  | "dashboard"
  | "accounts"
  | "transfer"
  | "categories"
  | "payees"
  | "budgets"
  | "savings"
  | "import";

interface NavItem {
  key: ViewName;
  label: string;
  icon: ComponentType<{ size?: number }>;
}

const NAV_ITEMS: NavItem[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "accounts", label: "Accounts", icon: Landmark },
  { key: "transfer", label: "Transfer", icon: ArrowLeftRight },
  { key: "categories", label: "Categories", icon: Tags },
  { key: "payees", label: "Payees", icon: Users },
  { key: "budgets", label: "Budgets", icon: Target },
  { key: "savings", label: "Savings", icon: PiggyBank },
  { key: "import", label: "Import", icon: Upload },
];

interface SidebarProps {
  activeView: ViewName;
  onNavigate: (view: ViewName) => void;
  onQuickAdd: () => void;
}

export function Sidebar({ activeView, onNavigate, onQuickAdd }: SidebarProps) {
  return (
    <nav className="sidebar" aria-label="Main navigation">
      <div className="sidebar-brand">Budget Tracker</div>

      <ul className="sidebar-nav">
        {NAV_ITEMS.map(({ key, label, icon: Icon }) => (
          <li key={key}>
            <button
              type="button"
              className={"sidebar-link" + (activeView === key ? " active" : "")}
              onClick={() => onNavigate(key)}
              aria-current={activeView === key ? "page" : undefined}
            >
              <Icon size={17} />
              <span>{label}</span>
            </button>
          </li>
        ))}
      </ul>

      <button type="button" className="sidebar-quick-add" onClick={onQuickAdd}>
        <Plus size={17} />
        <span>Quick add</span>
      </button>
    </nav>
  );
}
