"use server";

import { createClient } from "@/lib/supabase/server";
import { ownerFormSchema, type OwnerFormValues } from "@/lib/validators/owner";
import { revalidatePath } from "next/cache";

export async function getOwners(search?: string) {
  const supabase = await createClient();
  let query = supabase
    .from("owners")
    .select("*")
    .order("full_name");

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,dni_cuit.ilike.%${search}%,email.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getOwnerById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("owners")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function createOwner(values: OwnerFormValues) {
  const parsed = ownerFormSchema.parse(values);
  const supabase = await createClient();
  const { error } = await supabase.from("owners").insert({
    full_name: parsed.full_name,
    dni_cuit: parsed.dni_cuit || null,
    phone: parsed.phone || null,
    email: parsed.email || null,
    address: parsed.address || null,
    bank_info: parsed.bank_info,
    notes: parsed.notes || null,
  });
  if (error) throw error;
  revalidatePath("/duenos");
}

export async function updateOwner(id: string, values: OwnerFormValues) {
  const parsed = ownerFormSchema.parse(values);
  const supabase = await createClient();
  const { error } = await supabase
    .from("owners")
    .update({
      full_name: parsed.full_name,
      dni_cuit: parsed.dni_cuit || null,
      phone: parsed.phone || null,
      email: parsed.email || null,
      address: parsed.address || null,
      bank_info: parsed.bank_info,
      notes: parsed.notes || null,
    })
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/duenos");
  revalidatePath(`/duenos/${id}`);
}

export async function getOwnerProperties(ownerId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("properties")
    .select("id, address, unit, city, type, status, contracts:contracts(id, tenant:tenants(full_name), current_rent, currency, status)")
    .eq("owner_id", ownerId)
    .order("address");
  if (error) throw error;
  return data;
}

export async function deleteOwner(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("owners").delete().eq("id", id);
  if (error) {
    if (error.code === "23503") {
      throw new Error("No se puede eliminar: tiene propiedades asociadas");
    }
    throw error;
  }
  revalidatePath("/duenos");
}
