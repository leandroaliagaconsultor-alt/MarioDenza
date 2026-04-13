/**
 * Scrapes the official INDEC IPC spreadsheet to get the latest published values.
 *
 * Source: https://www.indec.gob.ar/ftp/cuadros/economia/sh_ipc_aperturas.xls
 *
 * Structure (verified April 2026):
 * - Sheet "Índices aperturas" (3rd sheet) contains absolute index values
 * - Row 5: dates as Excel serial numbers (one per column, starting col 1)
 * - Row 7: "Nivel general" with the IPC values we need
 * - First column (col 0) has category labels
 * - Data starts from column 1
 */

import * as XLSX from "xlsx";

export interface IpcDataPoint {
  period: string; // "YYYY-MM"
  value: number;
}

const INDEC_IPC_URL =
  "https://www.indec.gob.ar/ftp/cuadros/economia/sh_ipc_aperturas.xls";

export async function scrapeIndecIpc(): Promise<IpcDataPoint[]> {
  const res = await fetch(INDEC_IPC_URL, {
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) {
    throw new Error(`INDEC download failed: ${res.status}`);
  }

  const buffer = await res.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });

  // Use "Índices aperturas" sheet (absolute index values, not percentages)
  const sheetName = workbook.SheetNames.find((n) =>
    n.toLowerCase().includes("ndices aperturas")
  ) || workbook.SheetNames[2]; // fallback to 3rd sheet

  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: null,
  }) as unknown as unknown[][];

  // Find the header row (contains "Región") and "Nivel general" row
  let dateRow: unknown[] | null = null;
  let nivelGeneralRow: unknown[] | null = null;

  for (let i = 0; i < Math.min(20, data.length); i++) {
    const row = data[i];
    if (!row) continue;
    const firstCell = String(row[0] ?? "").trim().toLowerCase();

    if (firstCell.includes("región") || firstCell.includes("region")) {
      dateRow = row;
    }
    if (firstCell === "nivel general") {
      nivelGeneralRow = row;
      break;
    }
  }

  if (!nivelGeneralRow) {
    throw new Error(
      "No se encontró la fila 'Nivel general' en la hoja 'Índices aperturas'"
    );
  }

  if (!dateRow) {
    throw new Error("No se encontró la fila de fechas en el archivo del INDEC");
  }

  // Parse: dates from dateRow, values from nivelGeneralRow
  const results: IpcDataPoint[] = [];

  for (let col = 1; col < dateRow.length; col++) {
    const dateVal = dateRow[col];
    const dataVal = nivelGeneralRow[col];

    if (dateVal === null || dateVal === undefined) continue;
    if (dataVal === null || dataVal === undefined) continue;

    const numVal = Number(dataVal);
    if (isNaN(numVal) || numVal <= 0) continue;

    // Parse Excel serial date
    let period: string | null = null;

    if (typeof dateVal === "number") {
      const parsed = XLSX.SSF.parse_date_code(dateVal);
      if (parsed) {
        period = `${parsed.y}-${String(parsed.m).padStart(2, "0")}`;
      }
    }

    if (period) {
      results.push({ period, value: numVal });
    }
  }

  return results;
}

/**
 * Get the latest IPC value from the INDEC spreadsheet.
 */
export async function getLatestIndecIpc(): Promise<IpcDataPoint | null> {
  const data = await scrapeIndecIpc();
  if (data.length === 0) return null;
  return data[data.length - 1];
}
