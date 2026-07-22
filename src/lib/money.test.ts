import { describe, expect, it } from "vitest";
import { fromMinorUnits, toMinorUnits } from "./money";

describe("toMinorUnits", () => {
  it("converts whole-number strings", () => {
    expect(toMinorUnits("12")).toBe(1200);
  });

  it("converts two-decimal strings", () => {
    expect(toMinorUnits("12.50")).toBe(1250);
  });

  it("converts single-decimal strings", () => {
    expect(toMinorUnits("12.5")).toBe(1250);
  });

  it("converts numbers", () => {
    expect(toMinorUnits(12.5)).toBe(1250);
  });

  it("handles negative amounts", () => {
    expect(toMinorUnits("-12.50")).toBe(-1250);
  });

  it("handles zero", () => {
    expect(toMinorUnits("0")).toBe(0);
    expect(toMinorUnits(0)).toBe(0);
  });

  it("avoids classic floating-point rounding traps", () => {
    expect(toMinorUnits("0.1")).toBe(10);
    expect(toMinorUnits("0.29")).toBe(29);
    expect(toMinorUnits(19.99)).toBe(1999);
  });

  it("throws on garbage input", () => {
    expect(() => toMinorUnits("abc")).toThrow();
    expect(() => toMinorUnits("12.999")).toThrow();
    expect(() => toMinorUnits("")).toThrow();
  });
});

describe("fromMinorUnits", () => {
  it("formats whole amounts with two decimal places", () => {
    expect(fromMinorUnits(1200)).toBe("12.00");
  });

  it("formats fractional amounts", () => {
    expect(fromMinorUnits(1250)).toBe("12.50");
  });

  it("pads single-digit cents", () => {
    expect(fromMinorUnits(1205)).toBe("12.05");
  });

  it("formats negative amounts", () => {
    expect(fromMinorUnits(-1250)).toBe("-12.50");
  });

  it("formats zero", () => {
    expect(fromMinorUnits(0)).toBe("0.00");
  });

  it("throws on non-integer input", () => {
    expect(() => fromMinorUnits(12.5)).toThrow();
  });
});

describe("round-trip", () => {
  it("preserves value through toMinorUnits -> fromMinorUnits", () => {
    for (const value of ["0.00", "12.50", "-12.50", "1999.99", "0.01"]) {
      expect(fromMinorUnits(toMinorUnits(value))).toBe(value);
    }
  });
});
