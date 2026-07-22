import { describe, expect, it } from "vitest";
import { parseCsv } from "./csv";

describe("parseCsv", () => {
  it("parses simple comma-separated rows", () => {
    expect(parseCsv("a,b,c\n1,2,3")).toEqual([
      ["a", "b", "c"],
      ["1", "2", "3"],
    ]);
  });

  it("handles CRLF line endings", () => {
    expect(parseCsv("a,b\r\n1,2\r\n")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });

  it("handles a trailing newline without adding a phantom row", () => {
    expect(parseCsv("a,b\n1,2\n")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });

  it("keeps commas inside quoted fields intact", () => {
    expect(parseCsv('"Coffee, Tea & Co","12.50"')).toEqual([["Coffee, Tea & Co", "12.50"]]);
  });

  it("unescapes doubled quotes inside a quoted field", () => {
    expect(parseCsv('"Say ""hi""",ok')).toEqual([['Say "hi"', "ok"]]);
  });

  it("handles embedded newlines inside a quoted field", () => {
    expect(parseCsv('"line one\nline two",ok')).toEqual([["line one\nline two", "ok"]]);
  });

  it("skips blank lines", () => {
    expect(parseCsv("a,b\n\n1,2\n")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });

  it("preserves empty fields", () => {
    expect(parseCsv("a,,c")).toEqual([["a", "", "c"]]);
  });
});
