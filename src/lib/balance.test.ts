import { describe, expect, it } from "vitest";
import { derivedBalance } from "./balance";

describe("derivedBalance", () => {
  it("equals opening balance when there are no transactions", () => {
    expect(derivedBalance(5000, 0)).toBe(5000);
  });

  it("adds a positive transaction total (income-heavy account)", () => {
    expect(derivedBalance(1000, 2500)).toBe(3500);
  });

  it("adds a negative transaction total (expense-heavy account)", () => {
    expect(derivedBalance(1000, -1500)).toBe(-500);
  });

  it("handles a zero opening balance", () => {
    expect(derivedBalance(0, -750)).toBe(-750);
  });

  it("handles a negative opening balance (e.g. a credit card)", () => {
    expect(derivedBalance(-2000, 500)).toBe(-1500);
  });

  it("stays an integer in minor units, never a float", () => {
    const result = derivedBalance(1099, -1098);
    expect(Number.isInteger(result)).toBe(true);
    expect(result).toBe(1);
  });
});
