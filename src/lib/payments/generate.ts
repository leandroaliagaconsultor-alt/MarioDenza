import { SupabaseClient } from "@supabase/supabase-js";

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
    .select("id, current_rent, payment_day")
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

      return {
        contract_id: c.id,
        period,
        due_date,
        amount_due: c.current_rent,
        amount_paid: 0,
        discount_amount: 0,
        late_fee_amount: 0,
        commission_amount: 0,
        owner_payout: 0,
        status: "pendiente" as const,
      };
    });

  if (toInsert.length === 0) return { created: 0, skipped: contracts.length };

  const { error } = await supabase.from("payments").insert(toInsert);
  if (error) throw error;

  return { created: toInsert.length, skipped: contracts.length - toInsert.length };
}
