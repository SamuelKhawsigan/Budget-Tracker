import { toMinorUnits } from "./money";

// Bank CSV amounts are messier than user-typed input: currency symbols,
// thousands separators, and "(12.50)" meaning -12.50 are all common. This
// normalizes them and then delegates to the same strict toMinorUnits used
// everywhere else, so the integer-minor-units invariant still holds.
export function parseImportAmount(raw: string): number {
  let s = raw.trim();
  if (s === "") {
    throw new Error("Empty amount");
  }

  let negative = false;
  if (s.startsWith("(") && s.endsWith(")")) {
    negative = true;
    s = s.slice(1, -1).trim();
  }

  s = s.replace(/[^0-9.,-]/g, ""); // strip currency symbols, spaces, letters

  if (s.startsWith("-")) {
    negative = true;
    s = s.slice(1);
  }

  s = s.replace(/,/g, ""); // thousands separators

  const minor = toMinorUnits(s);
  return negative ? -Math.abs(minor) : Math.abs(minor);
}

// Ambiguous D/M/Y-style slash or dash dates default to day-first (DD/MM/YYYY),
// matching this app's MYR/Malaysia-oriented default locale rather than the
// US MM/DD/YYYY convention. ISO dates pass through unchanged.
export function parseImportDate(raw: string): string {
  const s = raw.trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return s;
  }

  const match = /^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/.exec(s);
  if (match) {
    const [, d, m, yRaw] = match;
    const y = yRaw.length === 2 ? `20${yRaw}` : yRaw;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  throw new Error(`Unrecognized date: ${raw}`);
}
