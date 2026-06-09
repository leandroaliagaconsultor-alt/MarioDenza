"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { scrapeIndecIpc } from "@/lib/indices/indec-scraper";
import { scrapeBcraIcl } from "@/lib/indices/bcra-scraper";

export async function getIndexValues() {
  const supabase = await createClient();

  const [{ data: ipcData }, { data: iclData }, { data: casaData }] = await Promise.all([
    supabase.from("index_cache").select("*").eq("index_type", "IPC").order("period", { ascending: false }).limit(12),
    supabase.from("index_cache").select("*").eq("index_type", "ICL").order("period", { ascending: false }).limit(12),
    supabase.from("index_cache").select("*").eq("index_type", "casa_propia").order("period", { ascending: false }).limit(12),
  ]);

  return [...(ipcData || []), ...(iclData || []), ...(casaData || [])];
}

export async function saveIndexValue(indexType: "ICL" | "IPC" | "casa_propia", period: string, value: number) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("index_cache")
    .upsert(
      {
        index_type: indexType,
        period: period + "-01",
        value,
        fetched_at: new Date().toISOString(),
      },
      { onConflict: "index_type,period" }
    );
  if (error) throw error;
  revalidatePath("/configuracion/indices");
}

export async function deleteIndexValue(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("index_cache").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/configuracion/indices");
}

export interface BulkIndexRow {
  period: string; // "YYYY-MM"
  icl: number | null;
  ipc: number | null;
  casa_propia: number | null;
}

/** Carga masiva de indices (ICL / IPC / Casa Propia) en una sola pasada. Hace upsert por (tipo, periodo). */
export async function bulkSaveIndices(rows: BulkIndexRow[]): Promise<{ saved: number }> {
  const supabase = await createClient();
  const fetched_at = new Date().toISOString();

  // Una fila de index_cache por cada valor presente; dedup por (tipo, periodo) para no chocar el ON CONFLICT.
  const byKey = new Map<string, { index_type: string; period: string; value: number; fetched_at: string }>();
  for (const r of rows) {
    if (!/^\d{4}-\d{2}$/.test(r.period)) continue;
    const period = r.period + "-01";
    const add = (index_type: string, value: number | null) => {
      if (value == null || !Number.isFinite(value) || value <= 0) return;
      byKey.set(`${index_type}|${period}`, { index_type, period, value, fetched_at });
    };
    add("ICL", r.icl);
    add("IPC", r.ipc);
    add("casa_propia", r.casa_propia);
  }

  const records = [...byKey.values()];
  if (records.length === 0) return { saved: 0 };

  const { error } = await supabase
    .from("index_cache")
    .upsert(records, { onConflict: "index_type,period" });
  if (error) throw error;

  revalidatePath("/configuracion/indices");
  return { saved: records.length };
}

export async function syncFromIndec() {
  const allData = await scrapeIndecIpc();
  if (allData.length === 0) {
    throw new Error("No se pudieron obtener datos del archivo del INDEC");
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("index_cache")
    .select("period")
    .eq("index_type", "IPC");

  const existingPeriods = new Set((existing || []).map((e) => e.period.substring(0, 7)));
  const newPoints = allData.filter(
    (p) => p.period.match(/^\d{4}-\d{2}$/) && !existingPeriods.has(p.period)
  );

  let inserted = 0;
  for (const point of newPoints) {
    const { error } = await supabase
      .from("index_cache")
      .upsert(
        { index_type: "IPC" as const, period: point.period + "-01", value: point.value, fetched_at: new Date().toISOString() },
        { onConflict: "index_type,period" }
      );
    if (!error) inserted++;
  }

  revalidatePath("/configuracion/indices");
  const latest = allData[allData.length - 1];
  return { inserted, latestPeriod: latest.period, latestValue: latest.value };
}

export async function syncFromBcra() {
  const allData = await scrapeBcraIcl();
  if (allData.length === 0) {
    throw new Error("No se pudieron obtener datos del archivo del BCRA");
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("index_cache")
    .select("period")
    .eq("index_type", "ICL");

  const existingPeriods = new Set((existing || []).map((e) => e.period.substring(0, 7)));
  const newPoints = allData.filter(
    (p) => p.period.match(/^\d{4}-\d{2}$/) && !existingPeriods.has(p.period)
  );

  // Also update existing periods with newer values (daily values change)
  let upserted = 0;
  for (const point of allData) {
    if (!point.period.match(/^\d{4}-\d{2}$/)) continue;
    const { error } = await supabase
      .from("index_cache")
      .upsert(
        { index_type: "ICL" as const, period: point.period + "-01", value: point.value, fetched_at: new Date().toISOString() },
        { onConflict: "index_type,period" }
      );
    if (!error) upserted++;
  }

  revalidatePath("/configuracion/indices");
  const latest = allData[allData.length - 1];
  return { inserted: newPoints.length, updated: upserted, latestPeriod: latest.period, latestValue: latest.value };
}
