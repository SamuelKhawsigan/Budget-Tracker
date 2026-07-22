// A small hand-rolled parser rather than a dependency: bank CSV exports are
// simple enough (RFC 4180-ish) that this covers them, and it stays testable
// alongside the other correctness-critical helpers in this folder.
// Handles quoted fields, embedded commas/newlines inside quotes, escaped ""
// quotes, and both CRLF and LF line endings.
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  const pushField = () => {
    row.push(field);
    field = "";
  };
  const pushRow = () => {
    pushField();
    rows.push(row);
    row = [];
  };

  for (let i = 0; i < text.length; i++) {
    const c = text[i];

    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
      continue;
    }

    if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      pushField();
    } else if (c === "\r") {
      // handled by the \n that follows (or end of string for a lone \r)
    } else if (c === "\n") {
      pushRow();
    } else {
      field += c;
    }
  }

  // Final field/row, unless the file ended cleanly on a newline.
  if (field !== "" || row.length > 0) {
    pushRow();
  }

  return rows.filter((r) => !(r.length === 1 && r[0] === ""));
}
