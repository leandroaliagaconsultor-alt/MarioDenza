"use server";

import { createClient } from "@/lib/supabase/server";
import { registerPaymentSchema, type RegisterPaymentValues } from "@/lib/validators/payment";
import { calculateCommission } from "@/lib/payments/commission";
import { generateMonthlyPayments } from "@/lib/payments/generate";
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
    .select("contract_id, amount_due, contract:contracts(commission_percentage, agency_collects)")
    .eq("id", paymentId)
    .single();
  if (payErr) throw payErr;

  const contractData = payment.contract;
  const contract = (Array.isArray(contractData) ? contractData[0] : contractData) as { commission_percentage: number; agency_collects: boolean } | null;

  const { commission_amount, owner_payout } = calculateCommission({
    amount_paid: parsed.amount_paid,
    discount_amount: parsed.discount_amount,
    late_fee_amount: parsed.late_fee_amount,
    commission_percentage: contract?.commission_percentage ?? 0,
    agency_collects: contract?.agency_collects ?? false,
  });

  const isPaid = parsed.amount_paid >= payment.amount_due - parsed.discount_amount;

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
      status: isPaid ? "pagado" : "parcial",
      notes: parsed.notes || null,
    })
    .eq("id", paymentId);
  if (error) throw error;

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
