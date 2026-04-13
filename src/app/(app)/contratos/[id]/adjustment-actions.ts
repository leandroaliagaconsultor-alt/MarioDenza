"use server";

import { createClient } from "@/lib/supabase/server";
import {
  calculateIpcAdjustment,
  type AdjustmentCalculation,
  type IpcReference,
  type LastAdjustmentInfo,
} from "@/lib/indices/ipc-calculator";
import { getCachedIndex, setCachedIndex } from "@/lib/indices/cache";
import { getIPCForMonth } from "@/lib/indices/indec";
import { revalidatePath } from "next/cache";
import { addMonths, format } from "date-fns";

/**
 * Get IPC value for a "YYYY-MM" period, using cache first, then API.
 */
async function getIpcValueWithCache(period: string): Promise<number | null> {
  const supabase = await createClient();
  const dbPeriod = period + "-01";

  const cached = await getCachedIndex(supabase, "IPC", dbPeriod);
  if (cached !== null) return cached;

  const [yearStr, monthStr] = period.split("-");
  const value = await getIPCForMonth(Number(yearStr), Number(monthStr));

  if (value !== null) {
    await setCachedIndex(supabase, "IPC", dbPeriod, value);
  }

  return value;
}

/**
 * Get the last adjustment info (arrival month of the previous adjustment).
 */
async function getLastAdjustmentInfo(contractId: string): Promise<LastAdjustmentInfo> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("adjustment_history")
    .select("to_period, index_value_to")
    .eq("contract_id", contractId)
    .order("applied_date", { ascending: false })
    .limit(1)
    .single();

  if (!data || !data.to_period) return null;

  return {
    toPeriod: data.to_period,
    toValue: data.index_value_to,
  };
}

export async function calculatePendingAdjustment(
  contractId: string
): Promise<{ data: AdjustmentCalculation | null; error: string | null }> {
  try {
    const supabase = await createClient();

    const { data: contract } = await supabase
      .from("contracts")
      .select("current_rent, ipc_referencia_inicial")
      .eq("id", contractId)
      .single();

    if (!contract) return { data: null, error: "Contrato no encontrado" };

    const lastAdj = await getLastAdjustmentInfo(contractId);
    const ipcRef = contract.ipc_referencia_inicial as IpcReference | null;

    const result = await calculateIpcAdjustment(
      contract.current_rent,
      lastAdj,
      ipcRef,
      new Date(),
      getIpcValueWithCache
    );

    return { data: result, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : "Error al calcular el aumento" };
  }
}

export async function applyAdjustment(
  contractId: string,
  calculation: AdjustmentCalculation,
  override?: { finalRent: number; reason: string }
): Promise<{ error: string | null }> {
  try {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: adjConfig } = await supabase
    .from("contract_adjustments")
    .select("id, frequency_months, next_adjustment_date")
    .eq("contract_id", contractId)
    .single();

  const isOverride = override !== undefined;
  const finalRent = isOverride ? override.finalRent : calculation.newRent;

  // Insert adjustment history with full traceability
  const { error: histErr } = await supabase
    .from("adjustment_history")
    .insert({
      contract_id: contractId,
      applied_date: new Date().toISOString().split("T")[0],
      previous_rent: calculation.previousRent,
      new_rent: finalRent,
      index_type: "IPC",
      index_value_from: calculation.fromIndexValue,
      index_value_to: calculation.toIndexValue,
      percentage_applied: Number(calculation.percentage.toFixed(2)),
      applied_by: user?.id ?? null,
      from_period: calculation.fromPeriod,
      to_period: calculation.toPeriod,
      coefficient: Number(calculation.coefficient.toFixed(6)),
      months_covered: calculation.monthsCovered,
      suggested_new_rent: calculation.newRent,
      manual_override: isOverride,
      override_reason: isOverride ? override.reason : null,
    });
  if (histErr) throw histErr;

  // Update contract current_rent
  const { error: contractErr } = await supabase
    .from("contracts")
    .update({ current_rent: finalRent })
    .eq("id", contractId);
  if (contractErr) throw contractErr;

  // Recalculate next adjustment date
  if (adjConfig) {
    const nextDate = addMonths(
      new Date(adjConfig.next_adjustment_date),
      adjConfig.frequency_months
    );
    await supabase
      .from("contract_adjustments")
      .update({ next_adjustment_date: format(nextDate, "yyyy-MM-dd") })
      .eq("id", adjConfig.id);
  }

  revalidatePath(`/contratos/${contractId}`);
  revalidatePath("/contratos");
  revalidatePath("/dashboard");
  return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error al aplicar el aumento" };
  }
}
