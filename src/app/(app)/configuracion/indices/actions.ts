"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { scrapeIndecIpc } from "@/lib/indices/indec-scraper";
import { scrapeBcraIcl } from "@/lib/indices/bcra-scraper";

export async function getIndexValues() {
  const supabase = await createClient();

  const [{ data: ipcData }, { data: iclData }] = await Promise.all([
    supabase.from("index_cache").select("*").eq("index_type", "IPC").order("period", { ascending: false }).limit(12),
    supabase.from("index_cache").select("*").eq("index_type", "ICL").order("period", { ascending: false }).limit(12),
  ]);

  return [...(ipcData || []), ...(iclData || [])];
}

export async function saveIndexValue(indexType: "ICL" | "IPC", period: string, value: number) {
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
