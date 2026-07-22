import { describe, expect, it } from "vitest";
import { importHashInput, sha256Hex } from "./hash";

describe("sha256Hex", () => {
  it("matches the known SHA-256 digest of an empty string", async () => {
    expect(await sha256Hex("")).toBe(
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    );
  });

  it("matches the known SHA-256 digest of 'abc'", async () => {
    expect(await sha256Hex("abc")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });

  it("is deterministic for the same input", async () => {
    expect(await sha256Hex("same input")).toBe(await sha256Hex("same input"));
  });

  it("differs for different input", async () => {
    expect(await sha256Hex("a")).not.toBe(await sha256Hex("b"));
  });
});

describe("importHashInput", () => {
  it("normalizes description case and surrounding whitespace", () => {
    expect(importHashInput(1, "2026-03-05", -1250, "  Coffee Shop  ")).toBe(
      importHashInput(1, "2026-03-05", -1250, "coffee shop"),
    );
  });

  it("differs when the account, date, amount, or description differ", () => {
    const base = importHashInput(1, "2026-03-05", -1250, "Coffee Shop");
    expect(importHashInput(2, "2026-03-05", -1250, "Coffee Shop")).not.toBe(base);
    expect(importHashInput(1, "2026-03-06", -1250, "Coffee Shop")).not.toBe(base);
    expect(importHashInput(1, "2026-03-05", -1300, "Coffee Shop")).not.toBe(base);
    expect(importHashInput(1, "2026-03-05", -1250, "Tea Shop")).not.toBe(base);
  });
});
