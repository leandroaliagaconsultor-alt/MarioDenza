"use server";

import { createClient } from "@/lib/supabase/server";
import { getUpcomingAdjustments, getUpcomingAdjustmentsCount } from "../aumentos/actions";

export async function getDashboardStats() {
  const supabase = await createClient();

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const today = new Date().toISOString().split("T")[0];
  const in90days = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const [
    { count: totalProperties },
    { count: occupiedProperties },
    { count: availableProperties },
    { count: maintenanceProperties },
    { count: activeContracts },
    { data: expiringContracts },
    { data: expiredContracts },
    { data: overduePayments },
    { data: monthCommissions },
    pendingAdjustments,
    { data: commissionHistory },
  ] = await Promise.all([
    supabase.from("properties").select("*", { count: "exact", head: true }).is("deleted_at", null),
    supabase.from("properties").select("*", { count: "exact", head: true }).is("deleted_at", null).eq("status", "ocupada"),
    supabase.from("properties").select("*", { count: "exact", head: true }).is("deleted_at", null).eq("status", "disponible"),
    supabase.from("properties").select("*", { count: "exact", head: true }).is("deleted_at", null).eq("status", "en_mantenimiento"),
    supabase.from("contracts").select("*", { count: "exact", head: true }).eq("status", "activo"),
    supabase.from("contracts")
      .select("id, end_date, property:properties(address, unit), tenant:tenants(full_name)")
      .in("status", ["activo", "por_vencer"])
      .gte("end_date", today)
      .lte("end_date", in90days)
      .order("end_date"),
    // Ya vencidos (fecha de fin pasada) que siguen activos/por_vencer → a renovar o finalizar
    supabase.from("contracts")
      .select("id, end_date, property:properties(address, unit), tenant:tenants(full_name)")
      .in("status", ["activo", "por_vencer"])
      .lt("end_date", today)
      .order("end_date"),
    supabase.from("payments")
      .select("id, period, amount_due, due_date, contract:contracts(property:properties(address, unit), tenant:tenants(full_name, phone))")
      .eq("status", "vencido")
      .order("due_date"),
    supabase.from("payments")
      .select("commission_amount")
      .eq("status", "pagado")
      .gte("period", new Date().toISOString().substring(0, 7) + "-01"),
    // Mismos "pendientes" que la sección Aumentos / badge / banner (regla de 15 días)
    getUpcomingAdjustments().catch(() => []),
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
    expiredContracts: expiredContracts || [],
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
  const in90days = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  // Overdue payments count
  const { count: overdueCount } = await supabase
    .from("payments")
    .select("*", { count: "exact", head: true })
    .eq("status", "vencido");

  // Contratos que vencen en los próximos 90 días (hoy → hoy+90)
  const { count: expiringCount } = await supabase
    .from("contracts")
    .select("*", { count: "exact", head: true })
    .in("status", ["activo", "por_vencer"])
    .gte("end_date", today)
    .lte("end_date", in90days);

  // Contratos ya vencidos (fecha de fin pasada) que siguen activos/por_vencer
  const { count: expiredCount } = await supabase
    .from("contracts")
    .select("*", { count: "exact", head: true })
    .in("status", ["activo", "por_vencer"])
    .lt("end_date", today);

  // Pending adjustments: misma regla de 15 días que el resto de la app
  const adjustmentCount = await getUpcomingAdjustmentsCount().catch(() => 0);

  return {
    overdueCount: overdueCount ?? 0,
    expiringCount: expiringCount ?? 0,
    expiredCount: expiredCount ?? 0,
    adjustmentCount,
    total: (overdueCount ?? 0) + (expiringCount ?? 0) + (expiredCount ?? 0) + adjustmentCount,
  };
}
