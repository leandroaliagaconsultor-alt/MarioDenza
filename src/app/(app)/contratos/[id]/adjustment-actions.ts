"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { addMonths, format } from "date-fns";
import {
  cyclePeriods,
  computeAdjustment,
  computeReferences,
  isCoefficientIndex,
  REFERENCE_INDICES,
  type ManualAdjustmentCalc,
  type ReferenceCalc,
} from "@/lib/indices/manual-adjustment";

export type AdjustmentCalcResult =
  | { kind: "ok"; calc: ManualAdjustmentCalc }
  | { kind: "needs_index"; indexType: string; periods: string[]; missing: string[] }
  | { kind: "reference"; indexType: string; previousRent: number; periods: string[]; references: ReferenceCalc[] }
  | { kind: "error"; message: string };

/**
 * Calcula el aumento SUGERIDO usando los índices cargados a mano en index_cache.
 * No aplica nada: solo propone. El valor final lo decide la persona.
 */
export async function calculatePendingAdjustment(contractId: string): Promise<AdjustmentCalcResult> {
  try {
    const supabase = await createClient();

    const { data: contract } = await supabase
      .from("contracts")
      .select("current_rent")
      .eq("id", contractId)
      .single();
    if (!contract) return { kind: "error", message: "Contrato no encontrado" };

    const { data: adj } = await supabase
      .from("contract_adjustments")
      .select("index_type, frequency_months, next_adjustment_date")
      .eq("contract_id", contractId)
      .single();
    if (!adj) return { kind: "error", message: "Este contrato no tiene configuración de ajuste." };

    const previousRent = contract.current_rent as number;
    const indexType = adj.index_type as string;

    // "Otro / Manual": no hay un índice que componer. Mostramos ICL/IPC/Casa Propia como
    // referencia (cómo quedaría con cada uno) y el monto final lo decide la persona.
    if (!isCoefficientIndex(indexType)) {
      const freq = adj.frequency_months as number | null;
      const nextDate = adj.next_adjustment_date as string | null;
      if (!freq || freq <= 0 || !nextDate) {
        return { kind: "reference", indexType, previousRent, periods: [], references: [] };
      }
      const refPeriods = cyclePeriods(nextDate, freq);
      const { data: refRows } = await supabase
        .from("index_cache")
        .select("index_type, period, value")
        .in("index_type", REFERENCE_INDICES as unknown as string[])
        .in("period", refPeriods.map((p) => `${p}-01`));

      const valuesByIndex = new Map<string, Map<string, number>>();
      for (const r of refRows ?? []) {
        const it = r.index_type as string;
        if (!valuesByIndex.has(it)) valuesByIndex.set(it, new Map());
        valuesByIndex.get(it)!.set((r.period as string).substring(0, 7), Number(r.value));
      }
      const references = computeReferences({ previousRent, periods: refPeriods, valuesByIndex });
      return { kind: "reference", indexType, previousRent, periods: refPeriods, references };
    }

    const periods = cyclePeriods(adj.next_adjustment_date as string, adj.frequency_months as number);

    const { data: rows } = await supabase
      .from("index_cache")
      .select("period, value")
      .eq("index_type", indexType)
      .in("period", periods.map((p) => `${p}-01`));

    const valuesByPeriod = new Map<string, number>();
    for (const r of rows ?? []) {
      valuesByPeriod.set((r.period as string).substring(0, 7), Number(r.value));
    }

    const { calc, missingPeriods } = computeAdjustment({ indexType, previousRent, periods, valuesByPeriod });
    if (!calc) return { kind: "needs_index", indexType, periods, missing: missingPeriods };

    return { kind: "ok", calc };
  } catch (err) {
    return { kind: "error", message: err instanceof Error ? err.message : "Error al calcular el aumento" };
  }
}

export interface ApplyAdjustmentInput {
  finalRent: number;
  indexType: string;
  suggestedNewRent: number | null;
  coefficient: number | null;
  percentage: number | null;
  fromPeriod: string | null;
  toPeriod: string | null;
  monthsCovered: number | null;
  note?: string;
}

/**
 * Aplica el aumento con el monto FINAL (manual). Guarda en el historial el sugerido vs.
 * el aplicado, actualiza el alquiler y recalcula la próxima fecha de ajuste.
 */
export async function applyAdjustment(
  contractId: string,
  input: ApplyAdjustmentInput
): Promise<{ error: string | null }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!input.finalRent || input.finalRent <= 0) {
      return { error: "Ingresá un monto válido." };
    }

    const { data: contract } = await supabase
      .from("contracts")
      .select("current_rent")
      .eq("id", contractId)
      .single();
    if (!contract) return { error: "Contrato no encontrado" };

    const { data: adjConfig } = await supabase
      .from("contract_adjustments")
      .select("id, frequency_months, next_adjustment_date")
      .eq("contract_id", contractId)
      .single();

    const previousRent = contract.current_rent as number;
    const appliedPct = previousRent > 0
      ? Number(((input.finalRent / previousRent - 1) * 100).toFixed(2))
      : 0;
    const isOverride = input.suggestedNewRent != null && input.finalRent !== input.suggestedNewRent;

    const { error: histErr } = await supabase.from("adjustment_history").insert({
      contract_id: contractId,
      applied_date: new Date().toISOString().split("T")[0],
      previous_rent: previousRent,
      new_rent: input.finalRent,
      index_type: input.indexType,
      percentage_applied: appliedPct,
      applied_by: user?.id ?? null,
      suggested_new_rent: input.suggestedNewRent,
      manual_override: isOverride,
      override_reason: input.note?.trim() ? input.note.trim() : null,
      from_period: input.fromPeriod,
      to_period: input.toPeriod,
      coefficient: input.coefficient,
      months_covered: input.monthsCovered,
    });
    if (histErr) throw histErr;

    const { error: contractErr } = await supabase
      .from("contracts")
      .update({ current_rent: input.finalRent })
      .eq("id", contractId);
    if (contractErr) throw contractErr;

    if (adjConfig) {
      const nextDate = addMonths(new Date(adjConfig.next_adjustment_date as string), adjConfig.frequency_months as number);
      await supabase
        .from("contract_adjustments")
        .update({ next_adjustment_date: format(nextDate, "yyyy-MM-dd") })
        .eq("id", adjConfig.id);
    }

    revalidatePath(`/contratos/${contractId}`);
    revalidatePath("/contratos");
    revalidatePath("/aumentos");
    revalidatePath("/dashboard");
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error al aplicar el aumento" };
  }
}
