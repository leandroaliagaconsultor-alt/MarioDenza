"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface LiquidationRow {
  paymentId: string;
  propertyId: string;
  propertyAddress: string;
  tenantName: string | null;
  amountPaid: number;
  amountDue: number;
  commission: number;
  ownerPayout: number;
  status: string;
}

export interface OwnerLiquidation {
  ownerId: string;
  ownerName: string;
  ownerPhone: string | null;
  currency: string;
  collected: number;
  total: number;
  ready: boolean;
  totalCollected: number;
  totalCommission: number;
  totalPayout: number;
  liquidatedAt: string | null;
  rows: LiquidationRow[];
}

function firstOf<T>(v: T | T[] | null | undefined): T | null {
  if (v == null) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

async function buildLiquidations(period: string, ownerId?: string): Promise<OwnerLiquidation[]> {
  const supabase = await createClient();
  const dbPeriod = period + "-01";

  const { data, error } = await supabase
    .from("payments")
    .select(`
      id, amount_paid, amount_due, commission_amount, owner_payout, status,
      contract:contracts(
        currency,
        property:properties(id, address, unit, owner:owners(id, full_name, phone)),
        tenant:tenants(full_name)
      )
    `)
    .eq("period", dbPeriod);
  if (error) throw error;

  const groups = new Map<string, OwnerLiquidation>();
  for (const p of data ?? []) {
    const contract = firstOf(p.contract) as { currency: string; property: unknown; tenant: unknown } | null;
    if (!contract) continue;
    const property = firstOf(contract.property) as
      | { id: string; address: string; unit: string | null; owner: unknown }
      | null;
    if (!property) continue;
    const owner = firstOf(property.owner) as { id: string; full_name: string; phone: string | null } | null;
    if (!owner) continue;
    if (ownerId && owner.id !== ownerId) continue;
    const tenant = firstOf(contract.tenant) as { full_name: string } | null;

    let g = groups.get(owner.id);
    if (!g) {
      g = {
        ownerId: owner.id,
        ownerName: owner.full_name,
        ownerPhone: owner.phone ?? null,
        currency: contract.currency ?? "ARS",
        collected: 0,
        total: 0,
        ready: false,
        totalCollected: 0,
        totalCommission: 0,
        totalPayout: 0,
        liquidatedAt: null,
        rows: [],
      };
      groups.set(owner.id, g);
    }
    g.total++;
    if (p.status === "pagado") g.collected++;
    g.totalCollected += p.amount_paid ?? 0;
    g.totalCommission += p.commission_amount ?? 0;
    g.totalPayout += p.owner_payout ?? 0;
    g.rows.push({
      paymentId: p.id,
      propertyId: property.id,
      propertyAddress: `${property.address}${property.unit ? ` - ${property.unit}` : ""}`,
      tenantName: tenant?.full_name ?? null,
      amountPaid: p.amount_paid ?? 0,
      amountDue: p.amount_due ?? 0,
      commission: p.commission_amount ?? 0,
      ownerPayout: p.owner_payout ?? 0,
      status: p.status,
    });
  }

  const result = [...groups.values()];
  for (const g of result) {
    g.ready = g.total > 0 && g.collected === g.total;
    g.rows.sort((a, b) => a.propertyAddress.localeCompare(b.propertyAddress));
  }

  // Estado de liquidación ya registrada
  let payoutQuery = supabase.from("owner_payouts").select("owner_id, paid_at").eq("period", dbPeriod);
  if (ownerId) payoutQuery = payoutQuery.eq("owner_id", ownerId);
  const { data: payouts } = await payoutQuery;
  const paidMap = new Map((payouts ?? []).map((x) => [x.owner_id as string, x.paid_at as string]));
  for (const g of result) {
    g.liquidatedAt = paidMap.get(g.ownerId) ?? null;
  }

  // Orden: listos para liquidar primero, después incompletos, liquidados al final
  result.sort((a, b) => {
    const rank = (g: OwnerLiquidation) => (g.liquidatedAt ? 2 : g.ready ? 0 : 1);
    const r = rank(a) - rank(b);
    return r !== 0 ? r : a.ownerName.localeCompare(b.ownerName);
  });

  return result;
}

export async function getOwnerLiquidations(period: string, search?: string): Promise<OwnerLiquidation[]> {
  const groups = await buildLiquidations(period);
  if (!search) return groups;
  const s = search.toLowerCase();
  return groups.filter(
    (g) =>
      g.ownerName.toLowerCase().includes(s) ||
      g.rows.some(
        (r) =>
          r.propertyAddress.toLowerCase().includes(s) ||
          (r.tenantName ?? "").toLowerCase().includes(s)
      )
  );
}

export async function getOwnerLiquidationDetail(
  ownerId: string,
  period: string
): Promise<OwnerLiquidation | null> {
  const groups = await buildLiquidations(period, ownerId);
  return groups[0] ?? null;
}

export async function markOwnerPaid(ownerId: string, period: string, total: number, notes?: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("owner_payouts").upsert(
    {
      owner_id: ownerId,
      period: period + "-01",
      total_amount: total,
      paid_at: new Date().toISOString().split("T")[0],
      notes: notes || null,
    },
    { onConflict: "owner_id,period" }
  );
  if (error) throw error;
  revalidatePath("/liquidaciones");
  revalidatePath(`/liquidaciones/${ownerId}`);
}

export async function getLiquidationPeriods(): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payments")
    .select("period")
    .order("period", { ascending: false });
  if (error) throw error;
  return [...new Set((data ?? []).map((p) => p.period.substring(0, 7)))];
}
