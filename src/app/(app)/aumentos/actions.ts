"use server";

import { createClient } from "@/lib/supabase/server";

export type AdjustmentStatus = "vencido" | "este_mes" | "proximo_mes" | "programado";

export interface UpcomingAdjustment {
  contractId: string;
  propertyId: string;
  propertyAddress: string;
  tenantName: string | null;
  tenantPhone: string | null;
  ownerName: string | null;
  ownerPhone: string | null;
  currentRent: number;
  currency: string;
  indexType: string;
  frequencyMonths: number;
  nextDate: string;
  status: AdjustmentStatus;
}

function firstOf<T>(v: T | T[] | null | undefined): T | null {
  if (v == null) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

function periodStr(y: number, mZeroBased: number): string {
  return `${y}-${String(mZeroBased + 1).padStart(2, "0")}`;
}

/** Aumentos de contratos activos con vencimiento hasta fin del mes que viene (incluye atrasados). */
export async function getUpcomingAdjustments(): Promise<UpcomingAdjustment[]> {
  const supabase = await createClient();

  const today = new Date();
  const y = today.getFullYear();
  const m = today.getMonth(); // 0-based
  const thisMonth = periodStr(y, m);
  const nextM = m === 11 ? 0 : m + 1;
  const nextY = m === 11 ? y + 1 : y;
  const nextMonth = periodStr(nextY, nextM);

  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  const endThisMonth = new Date(y, m + 1, 0);
  const endNextMonth = new Date(nextY, nextM + 1, 0);

  // Los aumentos del MES QUE VIENE recién se avisan 15 días antes de que empiece ese mes.
  // Antes de eso, solo se muestran los atrasados y los de este mes.
  const firstOfNextMonth = new Date(nextY, nextM, 1);
  const windowStart = new Date(firstOfNextMonth);
  windowStart.setDate(windowStart.getDate() - 15);
  const includeNextMonth = today.getTime() >= windowStart.getTime();
  const upperStr = fmt(includeNextMonth ? endNextMonth : endThisMonth);

  const { data, error } = await supabase
    .from("contract_adjustments")
    .select(`
      next_adjustment_date, index_type, frequency_months,
      contract:contracts(
        id, current_rent, currency, status,
        property:properties(id, address, unit, owner:owners(full_name, phone)),
        tenant:tenants(full_name, phone)
      )
    `)
    .lte("next_adjustment_date", upperStr)
    .order("next_adjustment_date", { ascending: true });
  if (error) throw error;

  const result: UpcomingAdjustment[] = [];
  for (const row of data ?? []) {
    const contract = firstOf(row.contract) as
      | { id: string; current_rent: number; currency: string; status: string; property: unknown; tenant: unknown }
      | null;
    if (!contract || contract.status !== "activo") continue;
    const property = firstOf(contract.property) as
      | { id: string; address: string; unit: string | null; owner: unknown }
      | null;
    if (!property) continue;
    const owner = firstOf(property.owner) as { full_name: string; phone: string | null } | null;
    const tenant = firstOf(contract.tenant) as { full_name: string; phone: string | null } | null;

    const nd = (row.next_adjustment_date as string).substring(0, 7);
    let status: AdjustmentStatus;
    if (nd < thisMonth) status = "vencido";
    else if (nd === thisMonth) status = "este_mes";
    else if (nd === nextMonth) status = "proximo_mes";
    else status = "programado";

    result.push({
      contractId: contract.id,
      propertyId: property.id,
      propertyAddress: `${property.address}${property.unit ? ` - ${property.unit}` : ""}`,
      tenantName: tenant?.full_name ?? null,
      tenantPhone: tenant?.phone ?? null,
      ownerName: owner?.full_name ?? null,
      ownerPhone: owner?.phone ?? null,
      currentRent: contract.current_rent,
      currency: contract.currency,
      indexType: row.index_type as string,
      frequencyMonths: row.frequency_months as number,
      nextDate: row.next_adjustment_date as string,
      status,
    });
  }

  return result;
}

/** Conteo para el badge del menú y el banner de inicio (aumentos próximos / atrasados). */
export async function getUpcomingAdjustmentsCount(): Promise<number> {
  const items = await getUpcomingAdjustments();
  return items.length;
}

export interface AdjustmentHistoryItem {
  appliedDate: string;
  previousRent: number;
  newRent: number;
  percentage: number;
  indexType: string;
}

export interface RecentAdjustmentGroup {
  contractId: string;
  propertyAddress: string;
  tenantName: string | null;
  tenantPhone: string | null;
  ownerName: string | null;
  ownerPhone: string | null;
  currency: string;
  lastDate: string;
  lastPreviousRent: number;
  lastNewRent: number;
  lastPercentage: number;
  history: AdjustmentHistoryItem[];
}

/** Últimos aumentos aplicados, agrupados por contrato (más reciente primero), con su histórico. */
export async function getRecentAdjustments(): Promise<RecentAdjustmentGroup[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("adjustment_history")
    .select(`
      contract_id, applied_date, previous_rent, new_rent, percentage_applied, index_type,
      contract:contracts(
        id, currency,
        property:properties(address, unit, owner:owners(full_name, phone)),
        tenant:tenants(full_name, phone)
      )
    `)
    .order("applied_date", { ascending: false });
  if (error) throw error;

  const groups = new Map<string, RecentAdjustmentGroup>();
  for (const row of data ?? []) {
    const contractId = row.contract_id as string;
    const contract = firstOf(row.contract) as
      | { id: string; currency: string; property: unknown; tenant: unknown }
      | null;
    const property = contract
      ? (firstOf(contract.property) as { address: string; unit: string | null; owner: unknown } | null)
      : null;
    const owner = property ? (firstOf(property.owner) as { full_name: string; phone: string | null } | null) : null;
    const tenant = contract ? (firstOf(contract.tenant) as { full_name: string; phone: string | null } | null) : null;

    const item: AdjustmentHistoryItem = {
      appliedDate: row.applied_date as string,
      previousRent: row.previous_rent as number,
      newRent: row.new_rent as number,
      percentage: row.percentage_applied as number,
      indexType: row.index_type as string,
    };

    let g = groups.get(contractId);
    if (!g) {
      // Primera fila de este contrato = su aumento más reciente (orden applied_date desc)
      g = {
        contractId,
        propertyAddress: property ? `${property.address}${property.unit ? ` - ${property.unit}` : ""}` : "—",
        tenantName: tenant?.full_name ?? null,
        tenantPhone: tenant?.phone ?? null,
        ownerName: owner?.full_name ?? null,
        ownerPhone: owner?.phone ?? null,
        currency: contract?.currency ?? "ARS",
        lastDate: item.appliedDate,
        lastPreviousRent: item.previousRent,
        lastNewRent: item.newRent,
        lastPercentage: item.percentage,
        history: [],
      };
      groups.set(contractId, g);
    }
    g.history.push(item);
  }

  return [...groups.values()];
}
