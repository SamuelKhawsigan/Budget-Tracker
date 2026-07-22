export type AccountType = "checking" | "savings" | "credit" | "cash" | "investment" | "other";

export const ACCOUNT_TYPES: AccountType[] = [
  "checking",
  "savings",
  "credit",
  "cash",
  "investment",
  "other",
];

export interface Account {
  id: number;
  name: string;
  type: AccountType;
  currency: string;
  opening_balance: number;
  is_archived: number;
  sort_order: number;
  created_at: string;
}

export type TransactionType = "income" | "expense" | "transfer";

export interface Category {
  id: number;
  name: string;
  parent_id: number | null;
  kind: "income" | "expense";
  color: string | null;
  icon: string | null;
  sort_order: number;
  is_archived: number;
}

export interface Payee {
  id: number;
  name: string;
  default_category_id: number | null;
  is_archived: number;
}

// One parsed CSV row on the import review screen, before it's written to
// transactions (nothing is committed until the user confirms).
export interface ImportCandidateRow {
  key: string;
  date: string;
  description: string;
  notes: string | null;
  amount: number; // signed minor units
  type: "income" | "expense";
  categoryId: number | null;
  importHash: string;
  isDuplicate: boolean;
  selected: boolean;
  parseError: string | null;
}
