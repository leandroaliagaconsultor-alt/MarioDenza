import { SupabaseClient } from "@supabase/supabase-js";
import { getICLForMonth } from "./bcra";
import { getIPCForMonth } from "./indec";
import { getCachedIndex, setCachedIndex } from "./cache";

export interface AdjustmentCalculation {
  previousRent: number;
  newRent: number;
  percentageApplied: number;
  indexValueFrom: number | null;
  indexValueTo: number | null;
  indexType: string;
  success: boolean;
  error?: string;
}

/**
 * Get index value for a given type and month, using cache first.
 */
async function getIndexValue(
  supabase: SupabaseClient,
  indexType: "ICL" | "IPC",
  year: number,
  month: number
): Promise<number | null> {
  const period = `${year}-${String(month).padStart(2, "0")}-01`;

  // Check cache
  const cached = await getCachedIndex(supabase, indexType, period);
  if (cached !== null) return cached;

  // Fetch from API
  let value: number | null = null;
  if (indexType === "ICL") {
    value = await getICLForMonth(year, month);
  } else if (indexType === "IPC") {
    value = await getIPCForMonth(year, month);
  }

  // Cache the result
  if (value !== null) {
    await setCachedIndex(supabase, indexType, period, value);
  }

  return value;
}

/**
 * Calculate the adjustment for a contract.
 */
export async function calculateAdjustment(
  supabase: SupabaseClient,
  params: {
    currentRent: number;
    indexType: string;
    frequencyMonths: number;
    fixedPercentage: number | null;
    referenceDate: string; // The adjustment date
  }
): Promise<AdjustmentCalculation> {
  const { currentRent, indexType, frequencyMonths, fixedPercentage, referenceDate } = params;

  // Fixed percentage - simple calculation
  if (indexType === "fixed_percentage") {
    if (!fixedPercentage || fixedPercentage <= 0) {
      return {
        previousRent: currentRent,
        newRent: currentRent,
        percentageApplied: 0,
        indexValueFrom: null,
        indexValueTo: null,
        indexType,
        success: false,
        error: "Porcentaje fijo no configurado",
      };
    }

    const newRent = Math.round(currentRent * (1 + fixedPercentage / 100));
    return {
      previousRent: currentRent,
      newRent,
      percentageApplied: fixedPercentage,
      indexValueFrom: null,
      indexValueTo: null,
      indexType,
      success: true,
    };
  }

  // ICL or IPC - need to fetch index values
  if (indexType === "ICL" || indexType === "IPC") {
    const refDate = new Date(referenceDate);
    const toYear = refDate.getFullYear();
    const toMonth = refDate.getMonth() + 1;

    // "From" period is frequencyMonths before
    const fromDate = new Date(refDate);
    fromDate.setMonth(fromDate.getMonth() - frequencyMonths);
    const fromYear = fromDate.getFullYear();
    const fromMonth = fromDate.getMonth() + 1;

    const [valueFrom, valueTo] = await Promise.all([
      getIndexValue(supabase, indexType, fromYear, fromMonth),
      getIndexValue(supabase, indexType, toYear, toMonth),
    ]);

    if (valueFrom === null || valueTo === null) {
      return {
        previousRent: currentRent,
        newRent: currentRent,
        percentageApplied: 0,
        indexValueFrom: valueFrom,
        indexValueTo: valueTo,
        indexType,
        success: false,
        error: `No se pudo obtener el indice ${indexType} para el periodo. Podes ingresar el porcentaje manualmente.`,
      };
    }

    const percentageApplied = Number((((valueTo - valueFrom) / valueFrom) * 100).toFixed(2));
    const newRent = Math.round(currentRent * (valueTo / valueFrom));

    return {
      previousRent: currentRent,
      newRent,
      percentageApplied,
      indexValueFrom: valueFrom,
      indexValueTo: valueTo,
      indexType,
      success: true,
    };
  }

  // Casa propia or custom - user must enter manually
  return {
    previousRent: currentRent,
    newRent: currentRent,
    percentageApplied: 0,
    indexValueFrom: null,
    indexValueTo: null,
    indexType,
    success: false,
    error: "Ingresa el porcentaje de aumento manualmente.",
  };
}
