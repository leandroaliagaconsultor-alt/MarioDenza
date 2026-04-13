/**
 * Parse CSV string into rows.
 * Handles quoted fields, commas inside quotes, newlines.
 */
export function parseCsv(rawText: string): string[][] {
  // Strip BOM and normalize line endings
  const text = rawText.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const rows: string[][] = [];
  let current = "";
  let inQuotes = false;
  let row: string[] = [];

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        row.push(current.trim());
        current = "";
      } else if (char === "\n" || (char === "\r" && next === "\n")) {
        row.push(current.trim());
        if (row.some((c) => c !== "")) rows.push(row);
        row = [];
        current = "";
        if (char === "\r") i++;
      } else {
        current += char;
      }
    }
  }

  // Last field
  row.push(current.trim());
  if (row.some((c) => c !== "")) rows.push(row);

  return rows;
}

export function csvToObjects(rows: string[][]): Record<string, string>[] {
  if (rows.length < 2) return [];
  const headers = rows[0].map((h) =>
    h.replace(/^\uFEFF/, "")     // Remove BOM
     .replace(/^["']+|["']+$/g, "") // Remove quotes
     .trim()
     .toLowerCase()
     .replace(/\s+/g, "_")
     .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents
  );
  return rows.slice(1).map((row) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = row[i] ?? ""; });
    return obj;
  });
}
