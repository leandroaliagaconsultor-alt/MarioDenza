/**
 * Scrapes the official BCRA ICL daily Excel to get historical ICL values.
 *
 * Source: https://www.bcra.gob.ar/Pdfs/PublicacionesEstadisticas/diar_icl.xls
 *
 * Structure:
 * - Sheet "Totales_diarios"
 * - Data starts around row 10
 * - Column 0: date (DD/MM/YYYY string)
 * - Column 1: ICL value (number)
 * - Daily values, we extract the last value of each month
 */

import * as XLSX from "xlsx";

export interface IclDataPoint {
  period: string; // "YYYY-MM"
  value: number;
  date: string;   // exact date of the value used
}

const BCRA_ICL_URL =
  "https://www.bcra.gob.ar/Pdfs/PublicacionesEstadisticas/diar_icl.xls";

export async function scrapeBcraIcl(): Promise<IclDataPoint[]> {
  const res = await fetch(BCRA_ICL_URL, {
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) {
    throw new Error(`BCRA ICL download failed: ${res.status}`);
  }

  const buffer = await res.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });

  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: null,
  }) as unknown as unknown[][];

  // Parse all daily values
  const dailyValues: { date: string; period: string; value: number }[] = [];

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (!row || !row[0] || !row[1]) continue;

    const dateStr = String(row[0]).trim();
    const value = Number(row[1]);

    if (isNaN(value) || value <= 0) continue;

    // Parse DD/MM/YYYY
    const match = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!match) continue;

    const day = match[1];
    const month = match[2].padStart(2, "0");
    const year = match[3];
    const period = `${year}-${month}`;

    dailyValues.push({ date: `${year}-${month}-${day.padStart(2, "0")}`, period, value });
  }

  // Group by month, take the last value of each month
  const byMonth = new Map<string, IclDataPoint>();
  for (const dv of dailyValues) {
    byMonth.set(dv.period, { period: dv.period, value: dv.value, date: dv.date });
  }

  // Sort by period
  return Array.from(byMonth.values()).sort((a, b) => a.period.localeCompare(b.period));
}

export async function getLatestBcraIcl(): Promise<IclDataPoint | null> {
  const data = await scrapeBcraIcl();
  if (data.length === 0) return null;
  return data[data.length - 1];
}
