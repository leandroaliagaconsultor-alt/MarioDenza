"use server";

import { createClient } from "@/lib/supabase/server";
import { contractFormSchema, type ContractFormValues } from "@/lib/validators/contract";
import { revalidatePath } from "next/cache";
import { calculateRetroactiveAdjustments, type RetroactiveResult } from "@/lib/indices/retroactive-calculator";
import { getCachedIndex } from "@/lib/indices/cache";
import { normalizeExtras } from "@/lib/payments/extras";

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
  if (parsed.adjustment_index_type && parsed.adjustment_frequency_months && parsed.adjustment_next_date) {
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
  revalidatePath(`/contratos/${id}`);
  revalidatePath("/contratos");
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
