import { describe, expect, it } from "vitest";
import { parseImportAmount, parseImportDate } from "./importParsing";

describe("parseImportAmount", () => {
  it("parses plain decimals", () => {
    expect(parseImportAmount("12.50")).toBe(1250);
  });

  it("parses explicit negatives", () => {
    expect(parseImportAmount("-12.50")).toBe(-1250);
  });

  it("treats parentheses as negative", () => {
    expect(parseImportAmount("(12.50)")).toBe(-1250);
  });

  it("strips currency symbols", () => {
    expect(parseImportAmount("$12.50")).toBe(1250);
    expect(parseImportAmount("RM12.50")).toBe(1250);
  });

  it("strips thousands separators", () => {
    expect(parseImportAmount("1,234.56")).toBe(123456);
    expect(parseImportAmount("$1,234.56")).toBe(123456);
  });

  it("handles surrounding whitespace", () => {
    expect(parseImportAmount("  12.50  ")).toBe(1250);
  });

  it("throws on empty input", () => {
    expect(() => parseImportAmount("")).toThrow();
    expect(() => parseImportAmount("   ")).toThrow();
  });
});

describe("parseImportDate", () => {
  it("passes ISO dates through unchanged", () => {
    expect(parseImportDate("2026-03-05")).toBe("2026-03-05");
  });

  it("interprets slash dates as day-first", () => {
    expect(parseImportDate("5/3/2026")).toBe("2026-03-05");
  });

  it("interprets dash dates as day-first", () => {
    expect(parseImportDate("05-03-2026")).toBe("2026-03-05");
  });

  it("expands two-digit years to 20YY", () => {
    expect(parseImportDate("5/3/26")).toBe("2026-03-05");
  });

  it("pads single-digit day/month", () => {
    expect(parseImportDate("1/1/2026")).toBe("2026-01-01");
  });

  it("throws on unrecognized formats", () => {
    expect(() => parseImportDate("March 5, 2026")).toThrow();
    expect(() => parseImportDate("")).toThrow();
  });
});
