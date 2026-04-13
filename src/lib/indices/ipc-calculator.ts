/**
 * Pure IPC adjustment calculator.
 *
 * Principle: coefficient = IPC_arrival / IPC_departure
 * new_rent = current_rent × coefficient
 *
 * The departure month is the arrival month of the previous adjustment.
 * If no previous adjustment exists, use contract.ipc_referencia_inicial.
 * This guarantees each month of inflation is applied exactly once.
 */

import { getLastPublishedIpcMonth, monthsBetween } from "./ipc-dates";

export type AdjustmentCalculation = {
  fromPeriod: string;        // "YYYY-MM", departure IPC month
  toPeriod: string;          // "YYYY-MM", arrival IPC month
  fromIndexValue: number;    // IPC value at departure
  toIndexValue: number;      // IPC value at arrival
  coefficient: number;       // toIndexValue / fromIndexValue, e.g. 1.0829
  percentage: number;        // (coefficient - 1) * 100, e.g. 8.29
  previousRent: number;      // rent before adjustment
  newRent: number;           // rent after adjustment (rounded to integer)
  monthsCovered: number;     // informational: number of IPC months composed
};

export type IpcReference = {
  period: string; // "YYYY-MM"
  value: number;
};

export type LastAdjustmentInfo = {
  toPeriod: string;   // "YYYY-MM" — the arrival month of the last adjustment
  toValue: number;    // the IPC value at that arrival month
} | null;

export type IpcValueProvider = (period: string) => Promise<number | null>;

/**
 * Calculate an IPC adjustment for a contract.
 *
 * This is a pure function with no side effects — it does not persist anything.
 * Persistence happens after the user confirms in the UI.
 *
 * @param currentRent - The rent the tenant is currently paying (NOT the original base rent)
 * @param lastAdjustment - Info from the last adjustment_history record, or null for first adjustment
 * @param ipcReferenciaInicial - The IPC reference saved when the contract was created (used only for first adjustment)
 * @param today - The date of the calculation
 * @param getIpcValue - Async function that returns IPC value for a "YYYY-MM" period (handles cache + API)
 */
export async function calculateIpcAdjustment(
  currentRent: number,
  lastAdjustment: LastAdjustmentInfo,
  ipcReferenciaInicial: IpcReference | null,
  today: Date,
  getIpcValue: IpcValueProvider
): Promise<AdjustmentCalculation> {
  // 1. Determine departure month and value
  let fromPeriod: string;
  let fromIndexValue: number;

  if (lastAdjustment) {
    // Use the arrival month of the previous adjustment as departure
    fromPeriod = lastAdjustment.toPeriod;
    fromIndexValue = lastAdjustment.toValue;
  } else if (ipcReferenciaInicial) {
    // First adjustment: use the reference saved at contract creation
    fromPeriod = ipcReferenciaInicial.period;
    fromIndexValue = ipcReferenciaInicial.value;
  } else {
    throw new Error(
      "No hay ajuste anterior ni referencia inicial de IPC. " +
      "Configura el IPC de referencia inicial del contrato."
    );
  }

  // 2. Determine arrival month: last published IPC as of today
  const toPeriod = getLastPublishedIpcMonth(today);

  // Validate that arrival is after departure
  if (toPeriod <= fromPeriod) {
    throw new Error(
      `El IPC de llegada (${toPeriod}) no es posterior al de partida (${fromPeriod}). ` +
      `Todavia no hay datos suficientes del IPC para calcular el proximo ajuste.`
    );
  }

  // 3. Get the arrival IPC value
  const toIndexValue = await getIpcValue(toPeriod);
  if (toIndexValue === null) {
    throw new Error(
      `No se encontro el valor del IPC para ${toPeriod}. ` +
      `Cargalo manualmente en Configuracion > Indices.`
    );
  }

  // 4. Calculate — no intermediate rounding
  const coefficient = toIndexValue / fromIndexValue;
  const percentage = (coefficient - 1) * 100;
  const newRent = Math.round(currentRent * coefficient);
  const monthsCovered = monthsBetween(fromPeriod, toPeriod);

  return {
    fromPeriod,
    toPeriod,
    fromIndexValue,
    toIndexValue,
    coefficient,
    percentage,
    previousRent: currentRent,
    newRent,
    monthsCovered,
  };
}
