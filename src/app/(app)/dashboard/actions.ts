"use server";

import { createClient } from "@/lib/supabase/server";

export async function getDashboardStats() {
  const supabase = await createClient();

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const [
    { count: totalProperties },
    { count: occupiedProperties },
    { count: availableProperties },
    { count: maintenanceProperties },
    { count: activeContracts },
    { data: expiringContracts },
    { data: overduePayments },
    { data: monthCommissions },
    { data: pendingAdjustments },
    { data: commissionHistory },
  ] = await Promise.all([
    supabase.from("properties").select("*", { count: "exact", head: true }),
    supabase.from("properties").select("*", { count: "exact", head: true }).eq("status", "ocupada"),
    supabase.from("properties").select("*", { count: "exact", head: true }).eq("status", "disponible"),
    supabase.from("properties").select("*", { count: "exact", head: true }).eq("status", "en_mantenimiento"),
    supabase.from("contracts").select("*", { count: "exact", head: true }).eq("status", "activo"),
    supabase.from("contracts")
      .select("id, end_date, property:properties(address, unit), tenant:tenants(full_name)")
      .in("status", ["activo", "por_vencer"])
      .lte("end_date", new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0])
      .order("end_date"),
    supabase.from("payments")
      .select("id, period, amount_due, due_date, contract:contracts(property:properties(address, unit), tenant:tenants(full_name, phone))")
      .eq("status", "vencido")
      .order("due_date"),
    supabase.from("payments")
      .select("commission_amount")
      .eq("status", "pagado")
      .gte("period", new Date().toISOString().substring(0, 7) + "-01"),
    supabase.from("contract_adjustments")
      .select("id, next_adjustment_date, index_type, frequency_months, contract_id, contract:contracts(property:properties(address, unit), tenant:tenants(full_name, phone), current_rent, currency)")
      .lte("next_adjustment_date", new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0])
      .order("next_adjustment_date"),
    supabase.from("payments")
      .select("period, commission_amount")
      .eq("status", "pagado")
      .gte("period", sixMonthsAgo.toISOString().substring(0, 7) + "-01")
      .order("period"),
  ]);

  // Group commissions by month
  const commissionsByMonth: Record<string, number> = {};
  for (const p of commissionHistory || []) {
    const month = p.period.substring(0, 7);
    commissionsByMonth[month] = (commissionsByMonth[month] || 0) + (p.commission_amount || 0);
  }
  const commissionChartData = Object.entries(commissionsByMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, amount]) => ({ month: month.substring(5), amount }));

  const totalCommissions = (monthCommissions || []).reduce((sum, p) => sum + (p.commission_amount || 0), 0);
  const totalOverdue = (overduePayments || []).reduce((sum, p) => sum + (p.amount_due || 0), 0);

  return {
    totalProperties: totalProperties ?? 0,
    occupiedProperties: occupiedProperties ?? 0,
    availableProperties: availableProperties ?? 0,
    activeContracts: activeContracts ?? 0,
    expiringContracts: expiringContracts || [],
    overduePayments: overduePayments || [],
    totalOverdue,
    totalCommissions,
    maintenanceProperties: maintenanceProperties ?? 0,
    commissionChartData,
    pendingAdjustments: pendingAdjustments || [],
  };
}

export async function getNotifications() {
  const supabase = await createClient();

  const today = new Date().toISOString().split("T")[0];
  const in30days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  // Overdue payments count
  const { count: overdueCount } = await supabase
    .from("payments")
    .select("*", { count: "exact", head: true })
    .eq("status", "vencido");

  // Expiring contracts count (90 days)
  const { count: expiringCount } = await supabase
    .from("contracts")
    .select("*", { count: "exact", head: true })
    .in("status", ["activo", "por_vencer"])
    .lte("end_date", new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);

  // Pending adjustments count
  const { count: adjustmentCount } = await supabase
    .from("contract_adjustments")
    .select("*", { count: "exact", head: true })
    .lte("next_adjustment_date", in30days);

  return {
    overdueCount: overdueCount ?? 0,
    expiringCount: expiringCount ?? 0,
    adjustmentCount: adjustmentCount ?? 0,
    total: (overdueCount ?? 0) + (expiringCount ?? 0) + (adjustmentCount ?? 0),
  };
}
