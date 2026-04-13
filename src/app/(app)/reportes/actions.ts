"use server";

import { createClient } from "@/lib/supabase/server";

export async function getCommissionsReport(year: number, month?: number) {
  const supabase = await createClient();
  let query = supabase
    .from("payments")
    .select("period, amount_paid, commission_amount, owner_payout, contract:contracts(property:properties(address, unit), tenant:tenants(full_name))")
    .eq("status", "pagado")
    .gte("period", `${year}-${month ? String(month).padStart(2, "0") : "01"}-01`)
    .lte("period", `${year}-${month ? String(month).padStart(2, "0") : "12"}-31`)
    .order("period");

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getOwnerSummary(year: number) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payments")
    .select("period, amount_paid, commission_amount, owner_payout, contract:contracts(property:properties(address, unit, owner:owners(id, full_name)))")
    .eq("status", "pagado")
    .gte("period", `${year}-01-01`)
    .lte("period", `${year}-12-31`)
    .order("period");
  if (error) throw error;
  return data;
}

export async function getDelinquencyReport() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payments")
    .select("period, amount_due, due_date, status, contract:contracts(property:properties(address, unit), tenant:tenants(full_name))")
    .in("status", ["vencido", "parcial"])
    .order("due_date");
  if (error) throw error;
  return data;
}

export async function getOccupancyReport() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("properties")
    .select("address, unit, city, type, status, owner:owners(full_name)")
    .order("status")
    .order("address");
  if (error) throw error;
  return data;
}
