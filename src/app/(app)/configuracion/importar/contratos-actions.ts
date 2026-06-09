"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { dedupKey, type ParsedContract } from "@/lib/import/contracts";

const FIXED_PAYMENT_DAY = 10;
const DEFAULT_CITY = "Mercedes";
const DEFAULT_PROVINCE = "Buenos Aires";
const DEFAULT_LEGAL_FRAMEWORK = "dnu_70_2023";

export interface ImportSummary {
  ownersCreated: number;
  tenantsCreated: number;
  propertiesCreated: number;
  contractsCreated: number;
  skipped: number;
  errors: string[];
}

/**
 * Crea dueños, inquilinos, propiedades, contratos y su config de ajuste a partir de
 * las filas ya parseadas y confirmadas. Hace dedup contra lo que ya existe en la base
 * (por nombre / dirección) para poder re-correr sin duplicar.
 */
export async function commitContractsImport(rows: ParsedContract[]): Promise<ImportSummary> {
  const supabase = await createClient();
  const errors: string[] = [];
  const valid = rows.filter((r) => !r.skip);

  // ---- Dueños ----
  const { data: existingOwners } = await supabase
    .from("owners").select("id, full_name").is("deleted_at", null);
  const ownerMap = new Map<string, string>();
  for (const o of existingOwners ?? []) ownerMap.set(dedupKey(o.full_name), o.id);

  const ownersToCreate = new Map<string, string>(); // key -> display name
  for (const r of valid) {
    const k = dedupKey(r.ownerName);
    if (!ownerMap.has(k) && !ownersToCreate.has(k)) ownersToCreate.set(k, r.ownerName);
  }
  let ownersCreated = 0;
  if (ownersToCreate.size > 0) {
    const payload = [...ownersToCreate.values()].map((full_name) => ({ full_name }));
    const { data, error } = await supabase.from("owners").insert(payload).select("id, full_name");
    if (error) { errors.push(`Dueños: ${error.message}`); }
    else {
      for (const o of data ?? []) ownerMap.set(dedupKey(o.full_name), o.id);
      ownersCreated = data?.length ?? 0;
    }
  }

  // ---- Inquilinos ----
  const { data: existingTenants } = await supabase
    .from("tenants").select("id, full_name").is("deleted_at", null);
  const tenantMap = new Map<string, string>();
  for (const t of existingTenants ?? []) tenantMap.set(dedupKey(t.full_name), t.id);

  const tenantsToCreate = new Map<string, string>();
  for (const r of valid) {
    const k = dedupKey(r.tenantName);
    if (!tenantMap.has(k) && !tenantsToCreate.has(k)) tenantsToCreate.set(k, r.tenantName);
  }
  let tenantsCreated = 0;
  if (tenantsToCreate.size > 0) {
    const payload = [...tenantsToCreate.values()].map((full_name) => ({ full_name, guarantors: [] }));
    const { data, error } = await supabase.from("tenants").insert(payload).select("id, full_name");
    if (error) { errors.push(`Inquilinos: ${error.message}`); }
    else {
      for (const t of data ?? []) tenantMap.set(dedupKey(t.full_name), t.id);
      tenantsCreated = data?.length ?? 0;
    }
  }

  // ---- Propiedades (dedup por dirección + unidad) ----
  const propKey = (address: string, unit: string | null) => `${dedupKey(address)}||${dedupKey(unit ?? "")}`;
  const { data: existingProps } = await supabase
    .from("properties").select("id, address, unit").is("deleted_at", null);
  const propMap = new Map<string, string>();
  for (const p of existingProps ?? []) propMap.set(propKey(p.address, p.unit), p.id);

  const propsToCreate = new Map<string, { address: string; unit: string | null; owner_id: string }>();
  for (const r of valid) {
    const k = propKey(r.address, r.unit);
    if (propMap.has(k) || propsToCreate.has(k)) continue;
    const owner_id = ownerMap.get(dedupKey(r.ownerName));
    if (!owner_id) { errors.push(`Fila ${r.rowIndex}: no se resolvió el dueño "${r.ownerName}".`); continue; }
    propsToCreate.set(k, { address: r.address, unit: r.unit, owner_id });
  }
  let propertiesCreated = 0;
  if (propsToCreate.size > 0) {
    const payload = [...propsToCreate.values()].map((p) => ({
      address: p.address,
      unit: p.unit,
      city: DEFAULT_CITY,
      province: DEFAULT_PROVINCE,
      type: "residencial",
      owner_id: p.owner_id,
      status: "ocupada",
    }));
    const { data, error } = await supabase.from("properties").insert(payload).select("id, address, unit");
    if (error) { errors.push(`Propiedades: ${error.message}`); }
    else {
      for (const p of data ?? []) propMap.set(propKey(p.address, p.unit), p.id);
      propertiesCreated = data?.length ?? 0;
    }
  }

  // ---- Contratos + contract_tenants + contract_adjustments (uno por uno para mapear el id) ----
  let contractsCreated = 0;
  for (const r of valid) {
    const property_id = propMap.get(propKey(r.address, r.unit));
    const tenant_id = tenantMap.get(dedupKey(r.tenantName));
    if (!property_id || !tenant_id) {
      errors.push(`Fila ${r.rowIndex}: falta propiedad o inquilino para crear el contrato.`);
      continue;
    }

    const { data: contract, error: cErr } = await supabase
      .from("contracts")
      .insert({
        property_id,
        tenant_id,
        start_date: r.startDate,
        end_date: r.endDate,
        currency: "ARS",
        base_rent: r.baseRent,
        current_rent: r.currentRent,
        payment_day: FIXED_PAYMENT_DAY,
        legal_framework: DEFAULT_LEGAL_FRAMEWORK,
        agency_collects: true,
        commission_percentage: r.commissionPercentage,
        status: "activo",
        notes: r.notes,
      })
      .select("id")
      .single();

    if (cErr || !contract) { errors.push(`Fila ${r.rowIndex} (${r.tenantName}): ${cErr?.message ?? "no se creó el contrato"}`); continue; }

    const { error: ctErr } = await supabase
      .from("contract_tenants")
      .insert({ contract_id: contract.id, tenant_id, is_primary: true });
    if (ctErr) errors.push(`Fila ${r.rowIndex}: inquilino del contrato: ${ctErr.message}`);

    if (r.frequencyMonths > 0 && r.nextAdjustmentDate) {
      const { error: aErr } = await supabase
        .from("contract_adjustments")
        .insert({
          contract_id: contract.id,
          index_type: r.indexType,
          frequency_months: r.frequencyMonths,
          next_adjustment_date: r.nextAdjustmentDate,
        });
      if (aErr) errors.push(`Fila ${r.rowIndex}: config de ajuste: ${aErr.message}`);
    }

    contractsCreated++;
  }

  revalidatePath("/duenos");
  revalidatePath("/inquilinos");
  revalidatePath("/propiedades");
  revalidatePath("/contratos");
  revalidatePath("/aumentos");
  revalidatePath("/pagos");

  return {
    ownersCreated,
    tenantsCreated,
    propertiesCreated,
    contractsCreated,
    skipped: rows.length - valid.length,
    errors,
  };
}
