"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function importOwners(rows: Record<string, string>[]) {
  const supabase = await createClient();
  const toInsert = rows.map((r) => ({
    full_name: r.nombre_completo,
    dni_cuit: r.dni_cuit || null,
    phone: r.telefono || null,
    email: r.email || null,
    address: r.direccion || null,
    bank_info: {
      banco: r.banco || "",
      cbu: r.cbu || "",
      alias: r.alias || "",
    },
    notes: r.notas || null,
  }));
  const { error } = await supabase.from("owners").insert(toInsert);
  if (error) throw error;
  revalidatePath("/duenos");
  return toInsert.length;
}

export async function importTenants(rows: Record<string, string>[]) {
  const supabase = await createClient();
  const toInsert = rows.map((r) => ({
    full_name: r.nombre_completo,
    dni: r.dni || null,
    phone: r.telefono || null,
    email: r.email || null,
    notes: r.notas || null,
    guarantors: [],
  }));
  const { error } = await supabase.from("tenants").insert(toInsert);
  if (error) throw error;
  revalidatePath("/inquilinos");
  return toInsert.length;
}

export async function importProperties(rows: Record<string, string>[]) {
  const supabase = await createClient();

  // Resolve owner names to IDs
  const { data: owners } = await supabase.from("owners").select("id, full_name");
  const ownerMap = new Map((owners || []).map((o) => [o.full_name.toLowerCase(), o.id]));

  const errors: string[] = [];
  const toInsert = [];

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const ownerId = ownerMap.get((r.nombre_dueno || "").toLowerCase());
    if (!ownerId) {
      errors.push(`Fila ${i + 2}: dueno "${r.nombre_dueno}" no encontrado`);
      continue;
    }
    toInsert.push({
      address: r.direccion,
      unit: r.unidad || null,
      city: r.ciudad || "Mercedes",
      province: r.provincia || "Buenos Aires",
      type: r.tipo || "residencial",
      owner_id: ownerId,
      status: r.estado || "disponible",
      notes: r.notas || null,
    });
  }

  if (errors.length > 0) {
    throw new Error(errors.join("\n"));
  }

  const { error } = await supabase.from("properties").insert(toInsert);
  if (error) throw error;
  revalidatePath("/propiedades");
  return toInsert.length;
}
