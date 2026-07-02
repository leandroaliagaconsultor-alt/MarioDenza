// Motor de aumentos basado en los índices cargados a mano (ICL / IPC / Casa Propia).
//
// Los valores que carga el cliente NO son niveles de índice acumulados, sino el
// COEFICIENTE MENSUAL ×1000: p.ej. 1042 = 1,042 = +4,2% ese mes (coincide con el IPC
// mensual real del INDEC). Para un contrato que ajusta cada N meses, el aumento sugerido
// se obtiene COMPONIENDO (multiplicando) los coeficientes de los N meses del ciclo.

export const INDEX_FACTOR_SCALE = 1000;

/**
 * Convierte el valor cargado al factor mensual (1.042 = +4,2%).
 * Acepta las dos formas en que puede haber quedado guardado:
 *  - decimal: 1.042  (p.ej. al pegar desde Excel en es-AR, "1.042" = 1042 miles → 1,042)
 *  - ×1000:   1042
 * Los factores mensuales reales rondan 1.0–1.3; cualquier valor > 10 está en formato ×1000.
 */
export function toMonthlyFactor(value: number): number {
  return value > 10 ? value / INDEX_FACTOR_SCALE : value;
}

/** Paso de redondeo del alquiler sugerido (al mil), para facilitar el manejo de efectivo/cambio. */
export const RENT_ROUND_STEP = 1000;

/** Redondea el alquiler sugerido al múltiplo más cercano de `step` (por defecto, al mil). */
export function roundRent(value: number, step: number = RENT_ROUND_STEP): number {
  if (step <= 0) return Math.round(value);
  return Math.round(value / step) * step;
}

const COEFFICIENT_INDICES = new Set(["ICL", "IPC", "casa_propia"]);

/** Índices que se calculan por coeficiente cargado (vs. % fijo / personalizado, que van a mano). */
export function isCoefficientIndex(indexType: string): boolean {
  return COEFFICIENT_INDICES.has(indexType);
}

export interface MonthFactor {
  period: string; // "YYYY-MM"
  value: number; // valor cargado (ej. 1042)
  factor: number; // value / 1000 (ej. 1.042)
}

export interface ManualAdjustmentCalc {
  indexType: string;
  fromPeriod: string;
  toPeriod: string;
  monthsCovered: number;
  months: MonthFactor[];
  coefficient: number; // producto de los factores
  percentage: number; // (coefficient - 1) * 100
  previousRent: number;
  suggestedNewRent: number;
  /** Desglose para mostrar (mixto: cada índice; escalonado: el tramo). Opcional. */
  components?: { label: string; percentage: number }[];
}

/** Los `freq` meses calendario anteriores al mes del ajuste, en orden cronológico ("YYYY-MM"). */
export function cyclePeriods(nextAdjustmentDate: string, freq: number): string[] {
  const [y, m] = nextAdjustmentDate.split("-").map(Number); // m es 1-based
  const periods: string[] = [];
  for (let i = freq; i >= 1; i--) {
    const d = new Date(Date.UTC(y, m - 1 - i, 1));
    periods.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
  }
  return periods;
}

/** Compone los factores mensuales del ciclo. `valuesByPeriod`: "YYYY-MM" -> valor cargado. */
export function computeAdjustment(params: {
  indexType: string;
  previousRent: number;
  periods: string[];
  valuesByPeriod: Map<string, number>;
}): { calc: ManualAdjustmentCalc | null; missingPeriods: string[] } {
  const { indexType, previousRent, periods, valuesByPeriod } = params;
  const missingPeriods = periods.filter((p) => !valuesByPeriod.has(p));
  if (missingPeriods.length > 0) return { calc: null, missingPeriods };

  const months: MonthFactor[] = periods.map((p) => {
    const value = valuesByPeriod.get(p) as number;
    return { period: p, value, factor: toMonthlyFactor(value) };
  });
  const coefficient = months.reduce((acc, mf) => acc * mf.factor, 1);
  const suggestedNewRent = roundRent(previousRent * coefficient);
  const percentage = Number(((coefficient - 1) * 100).toFixed(2));

  return {
    calc: {
      indexType,
      fromPeriod: periods[0],
      toPeriod: periods[periods.length - 1],
      monthsCovered: periods.length,
      months,
      coefficient: Number(coefficient.toFixed(6)),
      percentage,
      previousRent,
      suggestedNewRent,
    },
    missingPeriods: [],
  };
}

/** Los 3 índices que se muestran como referencia para los contratos "Otro / Manual". */
export const REFERENCE_INDICES = ["ICL", "IPC", "casa_propia"] as const;

export interface ReferenceCalc {
  indexType: string;
  calc: ManualAdjustmentCalc | null;
  missing: string[]; // meses sin cargar (si calc es null)
}

/**
 * Para un mismo ciclo, calcula cómo quedaría el aumento con cada índice de referencia
 * (ICL / IPC / Casa Propia). No elige uno: los muestra los tres para que la persona decida.
 * `valuesByIndex`: indexType -> ("YYYY-MM" -> valor cargado).
 */
export function computeReferences(params: {
  previousRent: number;
  periods: string[];
  valuesByIndex: Map<string, Map<string, number>>;
}): ReferenceCalc[] {
  const { previousRent, periods, valuesByIndex } = params;
  return REFERENCE_INDICES.map((indexType) => {
    const valuesByPeriod = valuesByIndex.get(indexType) ?? new Map<string, number>();
    const { calc, missingPeriods } = computeAdjustment({ indexType, previousRent, periods, valuesByPeriod });
    return { indexType, calc, missing: missingPeriods };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// MIXTO — ponderación de dos índices (ej. 50% ICL + 50% IPC).
// El coeficiente combinado es el promedio ponderado de los coeficientes de cada
// índice sobre el mismo ciclo de meses. Requiere ambos cálculos completos.
// ─────────────────────────────────────────────────────────────────────────────
export function combineWeighted(params: {
  previousRent: number;
  icl: ManualAdjustmentCalc | null;
  ipc: ManualAdjustmentCalc | null;
  weightIcl: number; // 0-100
}): ManualAdjustmentCalc | null {
  const { previousRent, icl, ipc, weightIcl } = params;
  if (!icl || !ipc) return null;
  const wIcl = weightIcl / 100;
  const wIpc = 1 - wIcl;
  const coefficient = icl.coefficient * wIcl + ipc.coefficient * wIpc;
  const suggestedNewRent = roundRent(previousRent * coefficient);
  const percentage = Number(((coefficient - 1) * 100).toFixed(2));
  return {
    indexType: "mixto",
    fromPeriod: icl.fromPeriod,
    toPeriod: icl.toPeriod,
    monthsCovered: icl.monthsCovered,
    months: [],
    coefficient: Number(coefficient.toFixed(6)),
    percentage,
    previousRent,
    suggestedNewRent,
    components: [
      { label: `ICL ${weightIcl}%`, percentage: icl.percentage },
      { label: `IPC ${100 - weightIcl}%`, percentage: ipc.percentage },
    ],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// ESCALONADO — tramos con montos ya pactados en el contrato.
// Cada tramo: { date: "YYYY-MM-DD", amount: <alquiler desde esa fecha> }.
// ─────────────────────────────────────────────────────────────────────────────
export interface Escalon {
  date: string; // "YYYY-MM-DD"
  amount: number; // alquiler que rige desde esa fecha
}

/** Tramos ordenados cronológicamente, descartando los inválidos. */
export function sortEscalones(escalones: Escalon[]): Escalon[] {
  return escalones
    .filter((e) => e && e.date && Number(e.amount) > 0)
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** El tramo que corresponde a `targetDate` (coincidencia exacta o el primero >= targetDate). */
export function pickEscalon(escalones: Escalon[], targetDate: string): Escalon | null {
  const sorted = sortEscalones(escalones);
  return sorted.find((e) => e.date === targetDate) ?? sorted.find((e) => e.date >= targetDate) ?? null;
}

/** El siguiente tramo después de `currentDate` (para avanzar la próxima fecha de ajuste). */
export function nextEscalonAfter(escalones: Escalon[], currentDate: string): Escalon | null {
  return sortEscalones(escalones).find((e) => e.date > currentDate) ?? null;
}

export function escalonCalc(params: {
  previousRent: number;
  escalones: Escalon[];
  targetDate: string;
}): ManualAdjustmentCalc | null {
  const { previousRent, escalones, targetDate } = params;
  const esc = pickEscalon(escalones, targetDate);
  if (!esc) return null;
  const coefficient = previousRent > 0 ? esc.amount / previousRent : 1;
  const percentage = Number(((coefficient - 1) * 100).toFixed(2));
  const period = esc.date.substring(0, 7);
  return {
    indexType: "escalonado",
    fromPeriod: period,
    toPeriod: period,
    monthsCovered: 0,
    months: [],
    coefficient: Number(coefficient.toFixed(6)),
    percentage,
    previousRent,
    suggestedNewRent: esc.amount,
    components: [{ label: `Tramo ${formatPeriodShort(period)}`, percentage }],
  };
}

/** "2026-02" -> "feb 2026" (para mostrar). */
export function formatPeriodShort(period: string): string {
  const NAMES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  const [y, m] = period.split("-").map(Number);
  return `${NAMES[m - 1] ?? m} ${y}`;
}
