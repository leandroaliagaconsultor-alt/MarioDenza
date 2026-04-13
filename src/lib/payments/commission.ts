interface CommissionInput {
  amount_paid: number;
  discount_amount: number;
  late_fee_amount: number;
  commission_percentage: number;
  agency_collects: boolean;
}

interface CommissionResult {
  commission_amount: number;
  owner_payout: number;
}

export function calculateCommission(input: CommissionInput): CommissionResult {
  if (!input.agency_collects || input.commission_percentage <= 0) {
    return { commission_amount: 0, owner_payout: input.amount_paid };
  }

  const netAmount = input.amount_paid - input.discount_amount + input.late_fee_amount;
  const commission_amount = Math.round(netAmount * (input.commission_percentage / 100));
  const owner_payout = netAmount - commission_amount;

  return { commission_amount, owner_payout };
}
