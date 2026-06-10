"use server";

import { createClient } from "@/lib/supabase/server";
import { registerPaymentSchema, type RegisterPaymentValues } from "@/lib/validators/payment";
import { calculateCommission } from "@/lib/payments/commission";
import { generateMonthlyPayments } from "@/lib/payments/generate";
import { normalizeExtras, extrasTotal } from "@/lib/payments/extras";
import { revalidatePath } from "next/cache";

export async function getPayments(filters: {
  search?: string;
  status?: string;
  period?: string;
}) {
  const supabase = await createClient();
  let query = supabase
    .from("payments")
    .select(`
      *,
      contract:contracts(
        id, currency, commission_percentage, agency_collects,
        property:properties(id, address, unit),
        tenant:tenants(id, full_name)
      )
    `)
    .order("period", { ascending: false });

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  if (filters.period) {
    query = query.eq("period", filters.period + "-01");
  }

  const { data, error } = await query;
  if (error) throw error;

  if (filters.search) {
    const s = filters.search.toLowerCase();
    return data.filter((p) => {
      const contract = p.contract as {
        property: { address: string; unit?: string } | null;
        tenant: { full_name: string } | null;
      } | null;
      return (
        contract?.property?.address?.toLowerCase().includes(s) ||
        contract?.tenant?.full_name?.toLowerCase().includes(s)
      );
    });
  }

  return data;
}

export async function getPaymentById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payments")
    .select(`
      *,
      contract:contracts(
        id, currency, commission_percentage, agency_collects,
        late_fee_enabled, late_fee_type, late_fee_value,
        property:properties(id, address, unit),
        tenant:tenants(id, full_name, phone)
      )
    `)
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function registerPayment(paymentId: string, values: RegisterPaymentValues) {
  const parsed = registerPaymentSchema.parse(values);
  const supabase = await createClient();

  // Get payment + contract info for commission calc
  const { data: payment, error: payErr } = await supabase
    .from("payments")
    .select("contract_id, amount_due, extras, contract:contracts(commission_percentage, agency_collects)")
    .eq("id", paymentId)
    .single();
  if (payErr) throw payErr;

  const contractData = payment.contract;
  const contract = (Array.isArray(contractData) ? contractData[0] : contractData) as { commission_percentage: number; agency_collects: boolean } | null;

  // Alquiler = total esperado original menos los extras que tenía el pago.
  const rent = payment.amount_due - extrasTotal(payment.extras as { concept?: string; amount?: number }[] | null);
  // Extras editados en el form → nuevo snapshot + nuevo total esperado.
  const extras = normalizeExtras(parsed.extras);
  const extrasT = extrasTotal(extras);
  const newAmountDue = rent + extrasT;

  const { commission_amount, owner_payout } = calculateCommission({
    amount_paid: parsed.amount_paid,
    discount_amount: parsed.discount_amount,
    late_fee_amount: parsed.late_fee_amount,
    commission_percentage: contract?.commission_percentage ?? 0,
    agency_collects: contract?.agency_collects ?? false,
    extras_total: extrasT,
  });

  const isPaid = parsed.amount_paid >= newAmountDue - parsed.discount_amount;

  const { error } = await supabase
    .from("payments")
    .update({
      amount_paid: parsed.amount_paid,
      paid_date: parsed.paid_date,
      payment_method: parsed.payment_method,
      discount_amount: parsed.discount_amount,
      late_fee_amount: parsed.late_fee_amount,
      commission_amount,
      owner_payout,
      amount_due: newAmountDue,
      extras,
      status: isPaid ? "pagado" : "parcial",
      notes: parsed.notes || null,
    })
    .eq("id", paymentId);
  if (error) throw error;

  // Asignar número de recibo correlativo (inmutable, solo la primera vez)
  await supabase.rpc("assign_receipt_number", { p_payment_id: paymentId });

  // Insert discount record if applicable
  if (parsed.discount_amount > 0) {
    await supabase.from("discounts").insert({
      payment_id: paymentId,
      type: "fixed",
      value: parsed.discount_amount,
      reason: parsed.discount_reason || null,
    });
  }

  revalidatePath("/pagos");
  revalidatePath(`/pagos/${paymentId}`);
  revalidatePath(`/contratos/${payment.contract_id}`);
}

/** Cobro rápido: registra el pago completo con defaults (hoy · efectivo · monto completo). */
export async function quickCollectPayment(paymentId: string) {
  const supabase = await createClient();

  const { data: payment, error: payErr } = await supabase
    .from("payments")
    .select("amount_due, contract_id, status, extras, contract:contracts(commission_percentage, agency_collects)")
    .eq("id", paymentId)
    .single();
  if (payErr) throw payErr;
  if (payment.status === "pagado") return;

  const contractData = payment.contract;
  const contract = (Array.isArray(contractData) ? contractData[0] : contractData) as
    | { commission_percentage: number; agency_collects: boolean }
    | null;

  const { commission_amount, owner_payout } = calculateCommission({
    amount_paid: payment.amount_due,
    discount_amount: 0,
    late_fee_amount: 0,
    commission_percentage: contract?.commission_percentage ?? 0,
    agency_collects: contract?.agency_collects ?? false,
    extras_total: extrasTotal(payment.extras as { concept?: string; amount?: number }[] | null),
  });

  const { error } = await supabase
    .from("payments")
    .update({
      amount_paid: payment.amount_due,
      paid_date: new Date().toISOString().split("T")[0],
      payment_method: "efectivo",
      discount_amount: 0,
      late_fee_amount: 0,
      commission_amount,
      owner_payout,
      status: "pagado",
    })
    .eq("id", paymentId);
  if (error) throw error;

  await supabase.rpc("assign_receipt_number", { p_payment_id: paymentId });

  revalidatePath("/pagos");
  revalidatePath(`/pagos/${paymentId}`);
  revalidatePath(`/contratos/${payment.contract_id}`);
  revalidatePath("/liquidaciones");
}

export async function generatePaymentsForMonth(year: number, month: number) {
  const supabase = await createClient();
  const result = await generateMonthlyPayments(supabase, year, month);
  revalidatePath("/pagos");
  revalidatePath("/dashboard");
  return result;
}

export async function getAvailablePeriods() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payments")
    .select("period")
    .order("period", { ascending: false });
  if (error) throw error;

  const unique = [...new Set(data.map((p) => p.period.substring(0, 7)))];
  return unique;
}

export interface RecentPayment {
  id: string;
  period: string;
  paid_date: string | null;
  amount_due: number;
  status: string;
}

export interface PropertyPaymentGroup {
  propertyId: string;
  address: string;
  unit: string | null;
  ownerId: string | null;
  ownerName: string | null;
  tenantName: string | null;
  currency: string;
  lastPaidDate: string | null;
  overdueCount: number;
  pendingCount: number;
  total: number;
  recent: RecentPayment[];
}

/** Agrupa los pagos por propiedad, con inquilino principal, dueño, último pago y los últimos 5 pagos. */
export async function getPaymentsByProperty(search?: string): Promise<PropertyPaymentGroup[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payments")
    .select(`
      id, period, paid_date, amount_due, status,
      contract:contracts(
        currency,
        tenant:tenants(full_name),
        property:properties(id, address, unit, owner:owners(id, full_name))
      )
    `)
    .order("period", { ascending: false });
  if (error) throw error;

  const groups = new Map<string, PropertyPaymentGroup>();
  for (const p of data) {
    const contract = (Array.isArray(p.contract) ? p.contract[0] : p.contract) as
      | { currency: string; tenant: unknown; property: unknown }
      | null;
    const property = contract
      ? ((Array.isArray(contract.property) ? contract.property[0] : contract.property) as
          | { id: string; address: string; unit: string | null; owner: unknown }
          | null)
      : null;
    if (!property) continue;
    const owner = (Array.isArray(property.owner) ? property.owner[0] : property.owner) as
      | { id: string; full_name: string }
      | null;
    const tenant = contract
      ? ((Array.isArray(contract.tenant) ? contract.tenant[0] : contract.tenant) as
          | { full_name: string }
          | null)
      : null;

    let g = groups.get(property.id);
    if (!g) {
      // Orden period desc: el primer pago del grupo es el más reciente → su inquilino es el principal actual
      g = {
        propertyId: property.id,
        address: property.address,
        unit: property.unit ?? null,
        ownerId: owner?.id ?? null,
        ownerName: owner?.full_name ?? null,
        tenantName: tenant?.full_name ?? null,
        currency: contract?.currency ?? "ARS",
        lastPaidDate: null,
        overdueCount: 0,
        pendingCount: 0,
        total: 0,
        recent: [],
      };
      groups.set(property.id, g);
    }
    g.total++;
    if (p.status === "vencido") g.overdueCount++;
    if (p.status === "pendiente") g.pendingCount++;
    if (p.paid_date && (!g.lastPaidDate || p.paid_date > g.lastPaidDate)) {
      g.lastPaidDate = p.paid_date;
    }
    if (g.recent.length < 5) {
      g.recent.push({ id: p.id, period: p.period, paid_date: p.paid_date, amount_due: p.amount_due, status: p.status });
    }
  }

  let result = [...groups.values()].sort((a, b) => a.address.localeCompare(b.address));
  if (search) {
    const s = search.toLowerCase();
    result = result.filter(
      (g) =>
        g.address.toLowerCase().includes(s) ||
        (g.ownerName ?? "").toLowerCase().includes(s) ||
        (g.tenantName ?? "").toLowerCase().includes(s)
    );
  }
  return result;
}

/** Historial completo de pagos de una propiedad (todos sus contratos), ordenado viejo→nuevo. */
export async function getPropertyPaymentHistory(propertyId: string) {
  const supabase = await createClient();

  const { data: property, error: pErr } = await supabase
    .from("properties")
    .select("id, address, unit, owner:owners(id, full_name)")
    .eq("id", propertyId)
    .single();
  if (pErr) throw pErr;

  const { data: contracts, error: cErr } = await supabase
    .from("contracts")
    .select("id")
    .eq("property_id", propertyId);
  if (cErr) throw cErr;

  const contractIds = (contracts ?? []).map((c) => c.id);
  if (contractIds.length === 0) return { property, payments: [] as PaymentHistoryRow[] };

  const { data: payments, error: payErr } = await supabase
    .from("payments")
    .select(`
      id, period, due_date, paid_date, amount_due, status,
      contract:contracts(currency, tenant:tenants(full_name))
    `)
    .in("contract_id", contractIds)
    .order("period", { ascending: true });
  if (payErr) throw payErr;

  return { property, payments: (payments ?? []) as PaymentHistoryRow[] };
}

export interface PaymentHistoryRow {
  id: string;
  period: string;
  due_date: string;
  paid_date: string | null;
  amount_due: number;
  status: string;
  contract:
    | { currency: string; tenant: { full_name: string } | { full_name: string }[] | null }
    | { currency: string; tenant: { full_name: string } | { full_name: string }[] | null }[]
    | null;
}
