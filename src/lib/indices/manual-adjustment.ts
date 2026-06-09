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
  const suggestedNewRent = Math.round(previousRent * coefficient);
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

/** "2026-02" -> "feb 2026" (para mostrar). */
export function formatPeriodShort(period: string): string {
  const NAMES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  const [y, m] = period.split("-").map(Number);
  return `${NAMES[m - 1] ?? m} ${y}`;
}
