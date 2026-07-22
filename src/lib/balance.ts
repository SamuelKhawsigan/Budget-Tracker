// Account balances are derived, never stored: opening_balance + SUM(amount)
// over all of an account's transactions. Computed on the fly so a cached
// running total can never drift out of sync with the transaction log.
export function derivedBalance(openingBalance: number, transactionTotal: number): number {
  return openingBalance + transactionTotal;
}
