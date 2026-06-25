"use server";

import { createClient } from "@/lib/supabase/server";
import { contractFormSchema, type ContractFormValues } from "@/lib/validators/contract";
import { revalidatePath } from "next/cache";
import { calculateRetroactiveAdjustments, type RetroactiveResult } from "@/lib/indices/retroactive-calculator";
import { getCachedIndex } from "@/lib/indices/cache";
import { normalizeExtras, extrasTotal } from "@/lib/payments/extras";
import { calculateCommission } from "@/lib/payments/commission";

export async function getContracts(search?: string, status?: string) {
  const supabase = await createClient();
  let query = supabase
    .from("contracts")
    .select(`
      *,
      property:properties(id, address, unit),
      tenant:tenants(id, full_name)
    `)
    .order("created_at", { ascending: false });

  if (status === "por_vencer") {
    // "Por vencer" = termina en los próximos 90 días (por fecha, no por el status guardado).
    const today = new Date().toISOString().split("T")[0];
    const in90days = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    query = query.in("status", ["activo", "por_vencer"]).gte("end_date", today).lte("end_date", in90days);
  } else if (status === "vencido") {
    // "Vencido" = la fecha de fin ya pasó y el contrato sigue sin renovar/finalizar.
    const today = new Date().toISOString().split("T")[0];
    query = query.in("status", ["activo", "por_vencer"]).lt("end_date", today);
  } else if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) throw error;

  if (search) {
    const s = search.toLowerCase();
    return data.filter((c) => {
      const prop = c.property as { address: string; unit?: string } | null;
      const ten = c.tenant as { full_name: string } | null;
      return (
        prop?.address?.toLowerCase().includes(s) ||
        prop?.unit?.toLowerCase().includes(s) ||
        ten?.full_name?.toLowerCase().includes(s)
      );
    });
  }

  return data;
}

export async function getContractById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contracts")
    .select(`
      *,
      property:properties(*, owner:owners(*)),
      tenant:tenants(*),
      contract_tenants(is_primary, tenant:tenants(id, full_name, phone, email)),
      contract_adjustments(*)
    `)
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function createContract(values: ContractFormValues & { retroactive_current_rent?: number; retroactive_adjustments?: RetroactiveResult["adjustments"]; renew_from?: string }) {
  const parsed = contractFormSchema.parse(values);
  const supabase = await createClient();

  const currentRent = values.retroactive_current_rent ?? parsed.base_rent;

  // Validate property is not already occupied by another active contract
  const { data: existingContract } = await supabase
    .from("contracts")
    .select("id")
    .eq("property_id", parsed.property_id)
    .in("status", ["activo", "por_vencer"])
    .limit(1)
    .single();
  if (existingContract) {
    throw new Error("La propiedad ya tiene un contrato activo. Finaliza el contrato actual antes de crear uno nuevo.");
  }

  // Calculate ipc_referencia_inicial: the IPC value at the start of the contract
  let ipcReferenciaInicial = null;
  if (parsed.adjustment_index_type === "IPC" || parsed.adjustment_index_type === "ICL") {
    const startDate = new Date(parsed.start_date);
    const refPeriod = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, "0")}`;
    const refValue = await getCachedIndex(supabase, parsed.adjustment_index_type as "ICL" | "IPC", refPeriod + "-01");
    if (refValue !== null) {
      ipcReferenciaInicial = { period: refPeriod, value: refValue };
    }
  }

  // Insert contract
  const { data: contract, error: contractError } = await supabase
    .from("contracts")
    .insert({
      property_id: parsed.property_id,
      tenant_id: parsed.tenant_id,
      start_date: parsed.start_date,
      end_date: parsed.end_date,
      currency: parsed.currency,
      base_rent: parsed.base_rent,
      current_rent: currentRent,
      ipc_referencia_inicial: ipcReferenciaInicial,
      payment_day: parsed.payment_day,
      legal_framework: parsed.legal_framework,
      agency_collects: parsed.agency_collects,
      commission_percentage: parsed.commission_percentage,
      late_fee_enabled: parsed.late_fee_enabled,
      late_fee_type: parsed.late_fee_enabled ? parsed.late_fee_type : null,
      late_fee_value: parsed.late_fee_enabled ? parsed.late_fee_value : null,
      status: "activo",
      notes: parsed.notes || null,
      extras: normalizeExtras(parsed.extras),
      previous_contract_id: values.renew_from || null,
    })
    .select("id")
    .single();

  if (contractError) throw contractError;

  // Inquilinos del contrato: principal (is_primary) + co-inquilinos
  const coTenantIds = (parsed.co_tenant_ids ?? []).filter((tid) => tid !== parsed.tenant_id);
  const tenantRows = [
    { contract_id: contract.id, tenant_id: parsed.tenant_id, is_primary: true },
    ...[...new Set(coTenantIds)].map((tid) => ({
      contract_id: contract.id,
      tenant_id: tid,
      is_primary: false,
    })),
  ];
  const { error: tenantsError } = await supabase.from("contract_tenants").insert(tenantRows);
  if (tenantsError) throw tenantsError;

  // If renewal, finalize the previous contract
  if (values.renew_from) {
    await supabase
      .from("contracts")
      .update({ status: "finalizado" })
      .eq("id", values.renew_from);
  }

  // Insert adjustment config if provided
  if (parsed.adjustment_index_type === "escalonado") {
    // Escalonado: la frecuencia/fecha salen de los tramos, no de los inputs sueltos.
    const escalones = (parsed.adjustment_escalones ?? [])
      .filter((e) => e.date && e.amount > 0)
      .sort((a, b) => a.date.localeCompare(b.date));
    if (escalones.length > 0) {
      const { error: adjError } = await supabase
        .from("contract_adjustments")
        .insert({
          contract_id: contract.id,
          index_type: "escalonado",
          frequency_months: 1, // placeholder: no se usa en escalonado
          next_adjustment_date: escalones[0].date,
          escalones,
        });
      if (adjError) throw adjError;
    }
  } else if (parsed.adjustment_index_type && parsed.adjustment_frequency_months && parsed.adjustment_next_date) {
    const { error: adjError } = await supabase
      .from("contract_adjustments")
      .insert({
        contract_id: contract.id,
        index_type: parsed.adjustment_index_type,
        frequency_months: parsed.adjustment_frequency_months,
        next_adjustment_date: parsed.adjustment_next_date,
        fixed_percentage: parsed.adjustment_index_type === "fixed_percentage"
          ? parsed.adjustment_fixed_percentage
          : null,
        mix_weight_icl: parsed.adjustment_index_type === "mixto"
          ? (parsed.adjustment_mix_weight_icl ?? 50)
          : null,
      });
    if (adjError) throw adjError;
  }

  // Insert retroactive adjustment history if provided
  if (values.retroactive_adjustments && values.retroactive_adjustments.length > 0) {
    const { data: { user } } = await supabase.auth.getUser();
    const historyRecords = values.retroactive_adjustments.map((adj) => ({
      contract_id: contract.id,
      applied_date: adj.date,
      previous_rent: adj.rentBefore,
      new_rent: adj.rentAfter,
      index_type: parsed.adjustment_index_type ?? "IPC",
      index_value_from: adj.fromValue,
      index_value_to: adj.toValue,
      percentage_applied: Number(adj.percentage.toFixed(2)),
      applied_by: user?.id ?? null,
      from_period: adj.fromPeriod,
      to_period: adj.toPeriod,
      coefficient: Number(adj.coefficient.toFixed(6)),
      months_covered: 0,
      suggested_new_rent: adj.rentAfter,
      manual_override: false,
    }));
    await supabase.from("adjustment_history").insert(historyRecords);
  }

  // Update property status to occupied
  await supabase
    .from("properties")
    .update({ status: "ocupada" })
    .eq("id", parsed.property_id);

  revalidatePath("/contratos");
  revalidatePath("/propiedades");
  return contract.id;
}

export async function updateContract(id: string, values: {
  start_date: string;
  end_date: string;
  current_rent: number;
  payment_day: number;
  legal_framework: string;
  agency_collects: boolean;
  commission_percentage: number;
  late_fee_enabled: boolean;
  late_fee_type: string | null;
  late_fee_value: number | null;
  notes: string;
  extras?: { concept: string; amount: number }[];
  adjustment_index_type?: string | null;
  adjustment_frequency_months?: number | null;
  adjustment_next_date?: string | null;
  adjustment_fixed_percentage?: number | null;
  adjustment_mix_weight_icl?: number | null;
  adjustment_escalones?: { date: string; amount: number }[];
}) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("contracts")
    .update({
      start_date: values.start_date,
      end_date: values.end_date,
      current_rent: values.current_rent,
      payment_day: values.payment_day,
      legal_framework: values.legal_framework,
      agency_collects: values.agency_collects,
      commission_percentage: values.commission_percentage,
      late_fee_enabled: values.late_fee_enabled,
      late_fee_type: values.late_fee_enabled ? values.late_fee_type : null,
      late_fee_value: values.late_fee_enabled ? values.late_fee_value : null,
      notes: values.notes || null,
      extras: normalizeExtras(values.extras),
    })
    .eq("id", id);
  if (error) throw error;

  // Reflejar el nuevo alquiler Y los extras del contrato en los pagos pendientes/vencidos.
  // Los extras se re-siembran desde el contrato (antes se mantenían los del pago, por lo
  // que una expensa cargada DESPUÉS de generar el recibo nunca aparecía).
  const contractExtras = normalizeExtras(values.extras);
  const extrasT = extrasTotal(contractExtras);
  const { data: pendings } = await supabase
    .from("payments")
    .select("id")
    .eq("contract_id", id)
    .in("status", ["pendiente", "vencido"]);
  for (const p of pendings ?? []) {
    const amount_due = values.current_rent + extrasT;
    const { commission_amount, owner_payout } = calculateCommission({
      amount_paid: amount_due,
      discount_amount: 0,
      late_fee_amount: 0,
      commission_percentage: values.commission_percentage,
      agency_collects: values.agency_collects,
      extras_total: extrasT,
    });
    await supabase
      .from("payments")
      .update({ amount_due, extras: contractExtras, commission_amount, owner_payout })
      .eq("id", p.id);
  }

  // Config de aumentos: solo si el formulario la mandó. Reemplaza la existente.
  if (values.adjustment_index_type !== undefined) {
    await supabase.from("contract_adjustments").delete().eq("contract_id", id);
    const t = values.adjustment_index_type;
    if (t === "escalonado") {
      const escalones = (values.adjustment_escalones ?? [])
        .filter((e) => e.date && e.amount > 0)
        .sort((a, b) => a.date.localeCompare(b.date));
      if (escalones.length > 0) {
        await supabase.from("contract_adjustments").insert({
          contract_id: id,
          index_type: "escalonado",
          frequency_months: 1, // placeholder: no se usa en escalonado
          next_adjustment_date: escalones[0].date,
          escalones,
        });
      }
    } else if (t && values.adjustment_frequency_months && values.adjustment_next_date) {
      await supabase.from("contract_adjustments").insert({
        contract_id: id,
        index_type: t,
        frequency_months: values.adjustment_frequency_months,
        next_adjustment_date: values.adjustment_next_date,
        fixed_percentage: t === "fixed_percentage" ? (values.adjustment_fixed_percentage ?? null) : null,
        mix_weight_icl: t === "mixto" ? (values.adjustment_mix_weight_icl ?? 50) : null,
      });
    }
    // t vacío/null → queda sin configuración de aumentos.
  }

  revalidatePath(`/contratos/${id}`);
  revalidatePath("/contratos");
  revalidatePath("/pagos");
  revalidatePath("/dashboard");
}

export async function finalizeContract(id: string) {
  const supabase = await createClient();

  const { data: contract } = await supabase
    .from("contracts")
    .select("property_id")
    .eq("id", id)
    .single();

  const { error } = await supabase
    .from("contracts")
    .update({ status: "finalizado" })
    .eq("id", id);
  if (error) throw error;

  // Free up the property
  if (contract) {
    await supabase
      .from("properties")
      .update({ status: "disponible" })
      .eq("id", contract.property_id);
  }

  revalidatePath("/contratos");
  revalidatePath(`/contratos/${id}`);
  revalidatePath("/propiedades");
}

/**
 * Borra DEFINITIVAMENTE un contrato (para limpiar duplicados): elimina sus pagos, recibos,
 * ajustes y co-inquilinos, y si quedan huérfanos también la propiedad, el dueño y el/los
 * inquilino(s). Es permanente. Pensado para corregir cargas duplicadas.
 */
export async function deleteContract(contractId: string) {
  const supabase = await createClient();

  const { data: contract } = await supabase
    .from("contracts")
    .select("id, property_id, tenant_id")
    .eq("id", contractId)
    .single();
  if (!contract) throw new Error("Contrato no encontrado");

  // Inquilinos del contrato (principal + co-inquilinos)
  const { data: cts } = await supabase
    .from("contract_tenants")
    .select("tenant_id")
    .eq("contract_id", contractId);
  const tenantIds = [...new Set<string>([contract.tenant_id, ...(cts ?? []).map((c) => c.tenant_id as string)].filter(Boolean))];

  // Descuentos de los pagos de este contrato (FK a payments)
  const { data: pays } = await supabase.from("payments").select("id").eq("contract_id", contractId);
  const payIds = (pays ?? []).map((p) => p.id);
  if (payIds.length > 0) await supabase.from("discounts").delete().in("payment_id", payIds);

  // Dependientes del contrato → contrato
  await supabase.from("adjustment_history").delete().eq("contract_id", contractId);
  await supabase.from("contract_adjustments").delete().eq("contract_id", contractId);
  await supabase.from("contract_tenants").delete().eq("contract_id", contractId);
  await supabase.from("payments").delete().eq("contract_id", contractId);
  const { error: cErr } = await supabase.from("contracts").delete().eq("id", contractId);
  if (cErr) throw cErr;

  // Propiedad: si no queda ningún contrato, se borra (y recordamos el dueño)
  let ownerId: string | null = null;
  if (contract.property_id) {
    const { data: prop } = await supabase.from("properties").select("owner_id").eq("id", contract.property_id).single();
    ownerId = (prop?.owner_id as string | undefined) ?? null;
    const { count: otherContracts } = await supabase
      .from("contracts").select("id", { count: "exact", head: true }).eq("property_id", contract.property_id);
    if ((otherContracts ?? 0) === 0) {
      await supabase.from("properties").delete().eq("id", contract.property_id);
    }
  }

  // Dueño: si no le quedan propiedades, se borra
  if (ownerId) {
    const { count: ownerProps } = await supabase
      .from("properties").select("id", { count: "exact", head: true }).eq("owner_id", ownerId);
    if ((ownerProps ?? 0) === 0) {
      await supabase.from("owners").delete().eq("id", ownerId);
    }
  }

  // Inquilinos: cada uno, si no está en ningún otro contrato, se borra
  for (const tid of tenantIds) {
    const { count: asMain } = await supabase.from("contracts").select("id", { count: "exact", head: true }).eq("tenant_id", tid);
    const { count: asCo } = await supabase.from("contract_tenants").select("contract_id", { count: "exact", head: true }).eq("tenant_id", tid);
    if ((asMain ?? 0) === 0 && (asCo ?? 0) === 0) {
      await supabase.from("tenants").delete().eq("id", tid);
    }
  }

  revalidatePath("/contratos");
  revalidatePath("/propiedades");
  revalidatePath("/duenos");
  revalidatePath("/inquilinos");
  revalidatePath("/pagos");
  revalidatePath("/dashboard");
}

export async function getAvailableProperties() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("properties")
    .select("id, address, unit, owner:owners(full_name)")
    .in("status", ["disponible", "en_mantenimiento"])
    .is("deleted_at", null)
    .order("address");
  if (error) throw error;
  return data;
}

export async function getAllProperties() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("properties")
    .select("id, address, unit, status, owner:owners(full_name)")
    .is("deleted_at", null)
    .order("address");
  if (error) throw error;
  return data;
}

export async function getAllTenants() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tenants")
    .select("id, full_name, dni")
    .is("deleted_at", null)
    .order("full_name");
  if (error) throw error;
  return data;
}

export async function createOwnerInline(data: {
  full_name: string;
  dni_cuit?: string;
  phone?: string;
  email?: string;
}) {
  const supabase = await createClient();
  const { data: owner, error } = await supabase
    .from("owners")
    .insert({
      full_name: data.full_name,
      dni_cuit: data.dni_cuit || null,
      phone: data.phone || null,
      email: data.email || null,
    })
    .select("id, full_name")
    .single();
  if (error) throw error;
  revalidatePath("/duenos");
  return owner;
}

export async function createPropertyInline(data: {
  address: string;
  unit?: string;
  city?: string;
  owner_id: string;
}) {
  const supabase = await createClient();
  const { data: property, error } = await supabase
    .from("properties")
    .insert({
      address: data.address,
      unit: data.unit || null,
      city: data.city || "Mercedes",
      province: "Buenos Aires",
      type: "residencial",
      owner_id: data.owner_id,
      status: "disponible",
    })
    .select("id, address, unit, status, owner:owners(full_name)")
    .single();
  if (error) throw error;
  revalidatePath("/propiedades");
  return property;
}

export async function createTenantInline(data: {
  full_name: string;
  dni?: string;
  phone?: string;
  email?: string;
}) {
  const supabase = await createClient();
  const { data: tenant, error } = await supabase
    .from("tenants")
    .insert({
      full_name: data.full_name,
      dni: data.dni || null,
      phone: data.phone || null,
      email: data.email || null,
      guarantors: [],
    })
    .select("id, full_name, dni")
    .single();
  if (error) throw error;
  revalidatePath("/inquilinos");
  return tenant;
}

export async function getAllOwners() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("owners")
    .select("id, full_name")
    .is("deleted_at", null)
    .order("full_name");
  if (error) throw error;
  return data;
}

/** Busca propietarios que podrían ser el mismo (por DNI/CUIT exacto o nombre parecido). */
export async function findOwnerMatches(
  name?: string,
  dni?: string
): Promise<{ id: string; full_name: string; dni_cuit: string | null }[]> {
  const supabase = await createClient();
  const filters: string[] = [];
  const cleanDni = dni?.replace(/[^\w]/g, "").trim();
  const cleanName = name?.replace(/,/g, " ").trim();
  if (cleanDni) filters.push(`dni_cuit.ilike.%${cleanDni}%`);
  if (cleanName) filters.push(`full_name.ilike.%${cleanName}%`);
  if (filters.length === 0) return [];

  const { data, error } = await supabase
    .from("owners")
    .select("id, full_name, dni_cuit")
    .is("deleted_at", null)
    .or(filters.join(","))
    .limit(5);
  if (error) throw error;
  return data ?? [];
}

export async function calculateRetroactive(
  baseRent: number,
  startDate: string,
  frequencyMonths: number,
  indexType: "ICL" | "IPC"
): Promise<RetroactiveResult> {
  const supabase = await createClient();

  async function getIndexValue(type: "ICL" | "IPC", period: string): Promise<number | null> {
    return getCachedIndex(supabase, type, period + "-01");
  }

  return calculateRetroactiveAdjustments(
    baseRent,
    startDate,
    frequencyMonths,
    indexType,
    new Date(),
    getIndexValue
  );
}

export async function getAdjustmentHistory(contractId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("adjustment_history")
    .select("*")
    .eq("contract_id", contractId)
    .order("applied_date", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getContractPayments(contractId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("contract_id", contractId)
    .order("period", { ascending: true });
  if (error) throw error;
  return data;
}
