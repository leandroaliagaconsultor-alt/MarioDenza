/**
 * Generate CSV string with UTF-8 BOM for proper Spanish characters in Excel.
 */
export function generateCsv(headers: string[], rows: string[][]): string {
  const BOM = "\uFEFF";
  const headerLine = headers.map(escapeCell).join(",");
  const dataLines = rows.map((row) => row.map(escapeCell).join(","));
  return BOM + [headerLine, ...dataLines].join("\n");
}

function escapeCell(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Trigger a CSV download in the browser.
 */
export function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
