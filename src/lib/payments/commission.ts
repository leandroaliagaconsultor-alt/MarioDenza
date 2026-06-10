interface CommissionInput {
  amount_paid: number;
  discount_amount: number;
  late_fee_amount: number;
  commission_percentage: number;
  agency_collects: boolean;
  /** Total de extras (expensas, ABL, etc.) incluido en amount_paid. NO comisionable: pasa al dueño. */
  extras_total?: number;
}

interface CommissionResult {
  commission_amount: number;
  owner_payout: number;
}

export function calculateCommission(input: CommissionInput): CommissionResult {
  const extras = Math.max(0, input.extras_total ?? 0);

  if (!input.agency_collects || input.commission_percentage <= 0) {
    // Sin comisión: todo lo cobrado (alquiler + extras) va al dueño.
    return { commission_amount: 0, owner_payout: input.amount_paid };
  }

  // La comisión se calcula SOLO sobre el alquiler (los extras no se comisionan).
  const rentNet = (input.amount_paid - extras) - input.discount_amount + input.late_fee_amount;
  const commission_amount = Math.round(Math.max(0, rentNet) * (input.commission_percentage / 100));
  // El dueño recibe el alquiler neto sin comisión + los extras enteros.
  const owner_payout = (rentNet - commission_amount) + extras;

  return { commission_amount, owner_payout };
}
