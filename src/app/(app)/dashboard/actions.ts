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

  // --- Widgets de visualización ---
  const periodStart = new Date().toISOString().substring(0, 7) + "-01";
  const in7days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const [
    { data: monthPayments },
    { data: settledPayouts },
    { data: dueThisWeek },
    { data: incompleteContracts },
  ] = await Promise.all([
    // Pagos del mes en curso → cobranza + a liquidar
    supabase.from("payments").select("status, amount_due, amount_paid, owner_payout").eq("period", periodStart),
    // Liquidaciones ya registradas este mes
    supabase.from("owner_payouts").select("total_amount").eq("period", periodStart),
    // Pagos que vencen en los próximos 7 días (todavía sin cobrar)
    supabase.from("payments")
      .select("id, due_date, amount_due, contract:contracts(property:properties(address, unit), tenant:tenants(full_name, phone))")
      .in("status", ["pendiente", "vencido"]).gte("due_date", today).lte("due_date", in7days).order("due_date"),
    // Contratos activos sin comisión cargada (datos incompletos)
    supabase.from("contracts")
      .select("id, current_rent, currency, property:properties(address, unit), tenant:tenants(full_name)")
      .eq("status", "activo").eq("commission_percentage", 0).order("start_date"),
  ]);

  let cobrado = 0, esperado = 0, payoutCobrado = 0;
  for (const p of monthPayments || []) {
    esperado += p.amount_due || 0;
    cobrado += p.amount_paid || 0;
    if (p.status === "pagado" || p.status === "parcial") payoutCobrado += p.owner_payout || 0;
  }
  const cobranzaPendiente = Math.max(0, esperado - cobrado);
  const settled = (settledPayouts || []).reduce((s, x) => s + (x.total_amount || 0), 0);
  const aLiquidar = Math.max(0, payoutCobrado - settled);

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
    // Widgets de visualización
    cobranzaCobrado: cobrado,
    cobranzaEsperado: esperado,
    cobranzaPendiente,
    aLiquidar,
    payoutCobrado,
    dueThisWeek: dueThisWeek || [],
    incompleteContracts: incompleteContracts || [],
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
