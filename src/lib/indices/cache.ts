import { SupabaseClient } from "@supabase/supabase-js";

export async function getCachedIndex(
  supabase: SupabaseClient,
  indexType: "ICL" | "IPC",
  period: string
): Promise<number | null> {
  const { data } = await supabase
    .from("index_cache")
    .select("value")
    .eq("index_type", indexType)
    .eq("period", period)
    .single();

  return data?.value ?? null;
}

export async function setCachedIndex(
  supabase: SupabaseClient,
  indexType: "ICL" | "IPC",
  period: string,
  value: number
): Promise<void> {
  await supabase
    .from("index_cache")
    .upsert(
      { index_type: indexType, period, value, fetched_at: new Date().toISOString() },
      { onConflict: "index_type,period" }
    );
}
