import { SupabaseClient } from "@supabase/supabase-js";
import { calculateCommission } from "./commission";
import { normalizeExtras, extrasTotal } from "./extras";

/**
 * Generates pending payments for all active contracts for a given month.
 * Idempotent: skips contracts that already have a payment for the period.
 */
export async function generateMonthlyPayments(
  supabase: SupabaseClient,
  year: number,
  month: number
): Promise<{ created: number; skipped: number }> {
  // Get all active contracts
  const { data: contracts, error: contractsErr } = await supabase
    .from("contracts")
    .select("id, current_rent, payment_day, commission_percentage, agency_collects, extras")
    .eq("status", "activo");

  if (contractsErr) throw contractsErr;
  if (!contracts || contracts.length === 0) return { created: 0, skipped: 0 };

  const period = `${year}-${String(month).padStart(2, "0")}-01`;

  // Check which contracts already have payments for this period
  const { data: existing } = await supabase
    .from("payments")
    .select("contract_id")
    .eq("period", period);

  const existingIds = new Set((existing || []).map((p) => p.contract_id));

  const toInsert = contracts
    .filter((c) => !existingIds.has(c.id))
    .map((c) => {
      // Calculate due date based on payment_day
      const lastDay = new Date(year, month, 0).getDate();
      const day = Math.min(c.payment_day, lastDay);
      const due_date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

      // Extras del contrato → snapshot del pago (monto editable al cobrar).
      const extras = normalizeExtras(c.extras as { concept?: string; amount?: number }[] | null);
      const extrasT = extrasTotal(extras);
      const amount_due = c.current_rent + extrasT; // total esperado = alquiler + extras

      // Comisión y pago al dueño PROYECTADOS sobre el monto a cobrar.
      // Al cobrar se recalculan sobre el monto realmente pagado (descuentos/recargos).
      // Los extras NO se comisionan: pasan enteros al dueño.
      const { commission_amount, owner_payout } = calculateCommission({
        amount_paid: amount_due,
        discount_amount: 0,
        late_fee_amount: 0,
        commission_percentage: c.commission_percentage ?? 0,
        agency_collects: c.agency_collects ?? true,
        extras_total: extrasT,
      });

      return {
        contract_id: c.id,
        period,
        due_date,
        amount_due,
        amount_paid: 0,
        discount_amount: 0,
        late_fee_amount: 0,
        commission_amount,
        owner_payout,
        extras,
        status: "pendiente" as const,
      };
    });

  if (toInsert.length === 0) return { created: 0, skipped: contracts.length };

  const { error } = await supabase.from("payments").insert(toInsert);
  if (error) throw error;

  return { created: toInsert.length, skipped: contracts.length - toInsert.length };
}
