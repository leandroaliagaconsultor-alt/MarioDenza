// Parseo de la hoja "contratos" del Excel del cliente hacia la estructura del sistema.
// Funciones puras (sin acceso a DB ni a browser): se usan tanto en el preview (cliente)
// como en el commit (server action).

export type ImportIndexType = "ICL" | "IPC" | "casa_propia" | "fixed_percentage" | "custom";

export interface ParsedContract {
  rowIndex: number; // fila en el Excel (1-based, sin contar encabezado)
  ownerName: string;
  tenantName: string;
  address: string;
  unit: string | null;
  startDate: string; // ISO yyyy-mm-dd
  endDate: string; // ISO yyyy-mm-dd
  durationMonths: number;
  indexType: ImportIndexType;
  frequencyMonths: number;
  baseRent: number;
  currentRent: number;
  commissionPercentage: number;
  nextAdjustmentDate: string; // ISO yyyy-mm-dd
  notes: string | null;
  warnings: string[];
  skip: boolean; // true => fila inválida, no se importa
}

const MONTHS: Record<string, number> = {
  enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6,
  julio: 7, agosto: 8, septiembre: 9, setiembre: 9, octubre: 10,
  noviembre: 11, diciembre: 12,
};

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** Serial de Excel (base 1899-12-30) -> ISO yyyy-mm-dd. Null si no es plausible. */
export function excelSerialToISO(serial: unknown): string | null {
  const n = typeof serial === "number" ? serial : Number(serial);
  if (!Number.isFinite(n) || n < 20000 || n > 80000) return null;
  const ms = Math.round((n - 25569) * 86400000); // 25569 = días entre 1899-12-30 y 1970-01-01
  return new Date(ms).toISOString().slice(0, 10);
}

export function parseSpanishMonth(raw: unknown): number | null {
  const s = String(raw ?? "").trim().toLowerCase();
  if (/^\d{1,2}$/.test(s)) { const n = Number(s); return n >= 1 && n <= 12 ? n : null; }
  return MONTHS[s] ?? null;
}

/** Suma meses a una fecha ISO sin drift de zona horaria. */
export function addMonthsISO(iso: string, months: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const base = new Date(Date.UTC(y, m - 1, d));
  base.setUTCMonth(base.getUTCMonth() + months);
  return base.toISOString().slice(0, 10);
}

/**
 * Normaliza un monto. Regla acordada: los valores "cortos" (sin separador de miles)
 * vienen en miles -> ×1000. Los completos (ej. "1,127,000") quedan igual.
 * Devuelve null si no hay número válido.
 */
export function normalizeMonto(raw: unknown): number | null {
  if (raw == null || raw === "") return null;
  let s = String(raw).trim().replace(/[^\d.,-]/g, "");
  if (!s) return null;
  if (s.includes(",")) s = s.replace(/,/g, ""); // comas = separador de miles
  const n = Number(s);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n < 10000 ? Math.round(n * 1000) : Math.round(n);
}

/** Separa "12 N° 858/64 3RO B" -> { address: "12 N° 858/64", unit: "3RO B" }. */
export function splitAddressUnit(raw: unknown): { address: string; unit: string | null } {
  const s = String(raw ?? "").trim().replace(/\s+/g, " ");
  const m = s.match(/^(\d+\s*N[°º]\s*\d+(?:\/\d+)?)\s*(.*)$/i);
  if (m) {
    const address = m[1].replace(/\s+/g, " ").trim();
    const unit = m[2].trim();
    return { address, unit: unit || null };
  }
  return { address: s, unit: null };
}

/** Normaliza el texto del índice. Devuelve el tipo + un aviso si hubo que asumir algo. */
export function normalizeIndice(raw: unknown): { type: ImportIndexType; warning?: string } {
  const s = String(raw ?? "").trim().toUpperCase();
  if (s === "ICL") return { type: "ICL" };
  if (s === "IPC") return { type: "IPC" };
  if (s.includes("CASA")) return { type: "casa_propia" };
  // Combinado (IPC+ICL), monto fijo, o cualquier otra variante → "Otro / Manual":
  // al aumentar se muestran ICL/IPC/Casa Propia de referencia y el monto final es manual.
  if (s.includes("ICL") && s.includes("IPC")) {
    return { type: "custom", warning: `Índice combinado "${String(raw).trim()}": se cargó como "Otro / Manual" (referencia ICL·IPC·Casa Propia).` };
  }
  if (!s) return { type: "custom", warning: 'Sin índice: se cargó como "Otro / Manual".' };
  return { type: "custom", warning: `Índice "${String(raw).trim()}": se cargó como "Otro / Manual" (referencia ICL·IPC·Casa Propia).` };
}

/** Comisión: 0.03 -> 3 ; 3 -> 3. */
export function parseComision(raw: unknown): number {
  const n = Number(String(raw ?? "").replace(",", "."));
  if (!Number.isFinite(n) || n < 0) return 0;
  return n <= 1 ? Number((n * 100).toFixed(2)) : Number(n.toFixed(2));
}

/** Primer ajuste >= hoy, según inicio + frecuencia. */
export function computeNextAdjustment(startISO: string, freq: number, todayISO: string): string {
  if (freq <= 0) return startISO;
  let next = addMonthsISO(startISO, freq);
  let guard = 0;
  while (next < todayISO && guard < 1000) { next = addMonthsISO(next, freq); guard++; }
  return next;
}

/** Índices fijos de columnas en la hoja "contratos". */
const COL = {
  inquilino: 0, propietario: 1, direccion: 2, inicio: 3, duracion: 4,
  indice: 5, aumentoCada: 6, montoInicio: 7, mesInicio: 8, anioInicio: 9,
  comision: 10, extras: 11, montoActual: 12,
} as const;

export interface ParseOptions {
  todayISO: string;
}

/** Parsea una fila cruda (array) de la hoja contratos. */
export function parseContractRow(raw: unknown[], rowIndex: number, opts: ParseOptions): ParsedContract {
  const warnings: string[] = [];
  const get = (i: number) => String(raw[i] ?? "").trim();

  const ownerName = get(COL.propietario);
  const tenantName = get(COL.inquilino);
  const { address, unit } = splitAddressUnit(raw[COL.direccion]);

  // Fecha de inicio: preferir el serial; si no, reconstruir desde MES/AÑO (día 1).
  let startDate = excelSerialToISO(raw[COL.inicio]);
  if (!startDate) {
    const mm = parseSpanishMonth(raw[COL.mesInicio]);
    const yy = Number(get(COL.anioInicio));
    if (mm && Number.isInteger(yy) && yy > 2000) {
      startDate = `${yy}-${pad2(mm)}-01`;
      warnings.push("Fecha de inicio reconstruida desde Mes/Año (día 1).");
    }
  }

  const durationMonths = Number(get(COL.duracion)) || 24;
  const freqRaw = Number(get(COL.aumentoCada));
  const frequencyMonths = Number.isFinite(freqRaw) && freqRaw > 0 ? Math.round(freqRaw) : 0;
  if (!frequencyMonths) warnings.push("Sin frecuencia de aumento válida.");

  const idx = normalizeIndice(raw[COL.indice]);
  if (idx.warning) warnings.push(idx.warning);

  const baseRent = normalizeMonto(raw[COL.montoInicio]);
  let currentRent = normalizeMonto(raw[COL.montoActual]);

  // Aviso cuando el monto actual venía "en miles" (se multiplicó ×1000)
  const rawActual = String(raw[COL.montoActual] ?? "").replace(/[^\d.,-]/g, "").replace(/,/g, "");
  if (currentRent != null && Number(rawActual) > 0 && Number(rawActual) < 10000) {
    warnings.push(`Monto actual interpretado en miles: ${rawActual} → ${currentRent.toLocaleString("es-AR")}.`);
  }
  if (currentRent == null && baseRent != null) {
    currentRent = baseRent;
    warnings.push("Sin monto actual: se usó el monto de inicio.");
  }
  if (baseRent != null && currentRent != null && currentRent < baseRent) {
    warnings.push("El monto actual es menor que el de inicio: revisar.");
  }

  const commissionPercentage = parseComision(raw[COL.comision]);
  const extras = get(COL.extras);
  const notes = extras ? extras : null;

  const endDate = startDate ? addMonthsISO(startDate, durationMonths) : "";
  const nextAdjustmentDate =
    startDate && frequencyMonths ? computeNextAdjustment(startDate, frequencyMonths, opts.todayISO) : (startDate || "");

  // Validaciones críticas
  let skip = false;
  if (!ownerName) { warnings.push("Falta el propietario."); skip = true; }
  if (!tenantName) { warnings.push("Falta el inquilino."); skip = true; }
  if (!address) { warnings.push("Falta la dirección."); skip = true; }
  if (!startDate) { warnings.push("No se pudo determinar la fecha de inicio."); skip = true; }
  if (baseRent == null) { warnings.push("Falta el monto de inicio."); skip = true; }

  return {
    rowIndex,
    ownerName,
    tenantName,
    address,
    unit,
    startDate: startDate ?? "",
    endDate,
    durationMonths,
    indexType: idx.type,
    frequencyMonths,
    baseRent: baseRent ?? 0,
    currentRent: currentRent ?? baseRent ?? 0,
    commissionPercentage,
    nextAdjustmentDate,
    notes,
    warnings,
    skip,
  };
}

/** Normaliza un nombre/clave para dedup (sin acentos, minúsculas, espacios colapsados). */
export function dedupKey(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
}
