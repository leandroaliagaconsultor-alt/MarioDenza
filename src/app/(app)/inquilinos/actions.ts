"use server";

import { createClient } from "@/lib/supabase/server";
import { tenantFormSchema, type TenantFormValues } from "@/lib/validators/tenant";
import { revalidatePath } from "next/cache";

export async function getTenants(search?: string) {
  const supabase = await createClient();
  let query = supabase.from("tenants").select("*").order("full_name");

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,dni.ilike.%${search}%,email.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getTenantById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("tenants").select("*").eq("id", id).single();
  if (error) throw error;
  return data;
}

export async function createTenant(values: TenantFormValues) {
  const parsed = tenantFormSchema.parse(values);
  const supabase = await createClient();
  const { error } = await supabase.from("tenants").insert({
    full_name: parsed.full_name,
    dni: parsed.dni || null,
    phone: parsed.phone || null,
    email: parsed.email || null,
    notes: parsed.notes || null,
    guarantors: parsed.guarantors,
  });
  if (error) throw error;
  revalidatePath("/inquilinos");
}

export async function updateTenant(id: string, values: TenantFormValues) {
  const parsed = tenantFormSchema.parse(values);
  const supabase = await createClient();
  const { error } = await supabase
    .from("tenants")
    .update({
      full_name: parsed.full_name,
      dni: parsed.dni || null,
      phone: parsed.phone || null,
      email: parsed.email || null,
      notes: parsed.notes || null,
      guarantors: parsed.guarantors,
    })
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/inquilinos");
  revalidatePath(`/inquilinos/${id}`);
}

export async function getTenantContracts(tenantId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contracts")
    .select("id, start_date, end_date, current_rent, currency, status, property:properties(id, address, unit, owner:owners(full_name))")
    .eq("tenant_id", tenantId)
    .order("start_date", { ascending: false });
  if (error) throw error;
  return data;
}

export async function deleteTenant(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("tenants").delete().eq("id", id);
  if (error) {
    if (error.code === "23503") {
      throw new Error("No se puede eliminar: tiene contratos asociados");
    }
    throw error;
  }
  revalidatePath("/inquilinos");
}
