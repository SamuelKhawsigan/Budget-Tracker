// Money is stored as integers in minor units (sen/cents), never floats.
// These are the only two places a value should cross between that integer
// representation and a human-readable decimal string.

export function toMinorUnits(amount: string | number): number {
  const str = typeof amount === "number" ? amount.toFixed(2) : amount.trim();
  const negative = str.startsWith("-");
  const unsigned = negative ? str.slice(1) : str;

  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(unsigned);
  if (!match) {
    throw new Error(`Invalid amount: ${amount}`);
  }

  const [, wholePart, fracPart = ""] = match;
  const fracPadded = (fracPart + "00").slice(0, 2);
  const minor = Number(wholePart) * 100 + Number(fracPadded);

  return negative ? -minor : minor;
}

export function fromMinorUnits(minor: number): string {
  if (!Number.isInteger(minor)) {
    throw new Error(`Minor units must be an integer, got ${minor}`);
  }

  const negative = minor < 0;
  const abs = Math.abs(minor);
  const whole = Math.floor(abs / 100);
  const frac = abs % 100;

  return `${negative ? "-" : ""}${whole}.${frac.toString().padStart(2, "0")}`;
}
