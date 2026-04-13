"use server";

import { createClient } from "@/lib/supabase/server";
import { propertyFormSchema, type PropertyFormValues } from "@/lib/validators/property";
import { revalidatePath } from "next/cache";

export async function getProperties(search?: string, status?: string) {
  const supabase = await createClient();
  let query = supabase
    .from("properties")
    .select("*, owner:owners(id, full_name)")
    .order("address");

  if (search) {
    query = query.or(`address.ilike.%${search}%,unit.ilike.%${search}%,city.ilike.%${search}%`);
  }

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getPropertyById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("properties")
    .select("*, owner:owners(*)")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function createProperty(values: PropertyFormValues) {
  const parsed = propertyFormSchema.parse(values);
  const supabase = await createClient();
  const { error } = await supabase.from("properties").insert({
    address: parsed.address,
    unit: parsed.unit || null,
    city: parsed.city || null,
    province: parsed.province || null,
    type: parsed.type,
    owner_id: parsed.owner_id,
    status: parsed.status,
    notes: parsed.notes || null,
  });
  if (error) throw error;
  revalidatePath("/propiedades");
}

export async function updateProperty(id: string, values: PropertyFormValues) {
  const parsed = propertyFormSchema.parse(values);
  const supabase = await createClient();
  const { error } = await supabase
    .from("properties")
    .update({
      address: parsed.address,
      unit: parsed.unit || null,
      city: parsed.city || null,
      province: parsed.province || null,
      type: parsed.type,
      owner_id: parsed.owner_id,
      status: parsed.status,
      notes: parsed.notes || null,
    })
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/propiedades");
  revalidatePath(`/propiedades/${id}`);
}

export async function deleteProperty(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("properties").delete().eq("id", id);
  if (error) {
    if (error.code === "23503") {
      throw new Error("No se puede eliminar: tiene contratos asociados");
    }
    throw error;
  }
  revalidatePath("/propiedades");
}

export async function getAllOwners() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("owners")
    .select("id, full_name")
    .order("full_name");
  if (error) throw error;
  return data;
}
