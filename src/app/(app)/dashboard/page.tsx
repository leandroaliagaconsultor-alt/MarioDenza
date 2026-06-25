import {
  Building2, FileText, TrendingUp, AlertTriangle, Calendar, CreditCard, MessageCircle, ExternalLink,
  Wallet, Clock, FileWarning, HandCoins,
} from "lucide-react";
import Link from "next/link";
import { getDashboardStats } from "./actions";
import type { UpcomingAdjustment } from "../aumentos/actions";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { INDEX_TYPES, type CurrencyType } from "@/lib/types/enums";
import { DashboardWhatsApp } from "./dashboard-whatsapp";
import { OccupancyChart } from "@/components/widgets/occupancy-chart";
import { CommissionChart } from "@/components/widgets/commission-chart";

function StatCard({ title, value, subtitle, icon: Icon, color }: {
  title: string; value: string; subtitle?: string; icon: React.ElementType; color: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white/80 p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-gray-400">{subtitle}</p>}
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const stats = await getDashboardStats();
  const now = new Date();
  const monthName = now.toLocaleDateString("es-AR", { month: "long", year: "numeric" });

  // Aumentos a ajustar agrupados por mes (este mes y el que viene), para organizarse mejor.
  const MONTHS_ES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const adjustmentsByMonth = (() => {
    const map = new Map<string, UpcomingAdjustment[]>();
    for (const a of stats.pendingAdjustments as UpcomingAdjustment[]) {
      const key = (a.nextDate ?? "").substring(0, 7);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(a);
    }
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([period, items]) => {
        const [yy, mm] = period.split("-").map(Number);
        return { period, label: `${MONTHS_ES[mm - 1] ?? period} ${yy}`, items };
      });
  })();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Resumen general de la inmobiliaria</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <StatCard title="Propiedades" value={String(stats.totalProperties)}
          subtitle={`${stats.occupiedProperties} ocupadas / ${stats.availableProperties} disponibles`}
          icon={Building2} color="bg-teal-600" />
        <StatCard title="Contratos activos" value={String(stats.activeContracts)}
          subtitle={`${stats.expiringContracts.length} por vencer (90 dias)`}
          icon={FileText} color="bg-blue-600" />
        <StatCard title="Comisiones del mes" value={formatCurrency(stats.totalCommissions)}
          subtitle={monthName} icon={TrendingUp} color="bg-emerald-600" />
        <StatCard title="Pagos vencidos" value={String(stats.overduePayments.length)}
          subtitle={`Morosidad: ${formatCurrency(stats.totalOverdue)}`}
          icon={AlertTriangle} color="bg-amber-500" />
        <StatCard title="A liquidar a dueños" value={formatCurrency(stats.aLiquidar)}
          subtitle={`${monthName} — cobrado ${formatCurrency(stats.payoutCobrado)}`}
          icon={HandCoins} color="bg-violet-600" />
      </div>

      {/* Cobranza del mes */}
      <div className="rounded-xl border border-gray-200 bg-white/80 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Wallet className="h-5 w-5 text-emerald-600" /> Cobranza del mes
          </h2>
          <span className="text-sm text-gray-500 capitalize">{monthName}</span>
        </div>
        <Separator className="my-3" />
        {stats.cobranzaEsperado === 0 ? (
          <p className="py-4 text-center text-sm text-gray-400">Todavía no hay pagos generados para este mes</p>
        ) : (
          <>
            <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-emerald-500"
                style={{ width: `${Math.min(100, Math.round((stats.cobranzaCobrado / stats.cobranzaEsperado) * 100))}%` }}
              />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-xs font-medium uppercase text-gray-500">Cobrado</p>
                <p className="mt-0.5 font-bold text-emerald-700">{formatCurrency(stats.cobranzaCobrado)}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-gray-500">Falta cobrar</p>
                <p className="mt-0.5 font-bold text-amber-600">{formatCurrency(stats.cobranzaPendiente)}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-gray-500">Esperado total</p>
                <p className="mt-0.5 font-bold text-gray-900">{formatCurrency(stats.cobranzaEsperado)}</p>
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-400">
              {Math.round((stats.cobranzaCobrado / stats.cobranzaEsperado) * 100)}% cobrado de lo esperado este mes
            </p>
          </>
        )}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <OccupancyChart
          occupied={stats.occupiedProperties}
          available={stats.availableProperties}
          maintenance={stats.maintenanceProperties}
          total={stats.totalProperties}
        />
        <CommissionChart data={stats.commissionChartData} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Vencidos — a renovar o finalizar */}
        {stats.expiredContracts.length > 0 && (
          <div className="rounded-xl border border-orange-200 bg-orange-50/40 p-6 shadow-sm lg:col-span-2">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <AlertTriangle className="h-5 w-5 text-orange-500" /> Vencidos — a renovar o finalizar
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              Contratos cuya fecha de fin ya pasó. Renoválos (nuevo contrato) o finalizálos.
            </p>
            <Separator className="my-3" />
            <div className="space-y-3">
              {stats.expiredContracts.slice(0, 8).map((c: any) => {
                const prop = Array.isArray(c.property) ? c.property[0] : c.property;
                const ten = Array.isArray(c.tenant) ? c.tenant[0] : c.tenant;
                return (
                  <Link key={c.id} href={`/contratos/${c.id}`} className="flex items-center justify-between rounded-lg border border-orange-100 bg-white p-3 transition hover:bg-orange-50/50">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{prop?.address}{prop?.unit ? ` - ${prop.unit}` : ""}</p>
                      <p className="text-xs text-gray-500">{ten?.full_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-orange-600">Venció {formatDate(c.end_date)}</p>
                      <p className="text-xs text-orange-500">Requiere acción</p>
                    </div>
                  </Link>
                );
              })}
              {stats.expiredContracts.length > 8 && (
                <p className="text-center text-xs text-gray-400">y {stats.expiredContracts.length - 8} más…</p>
              )}
            </div>
          </div>
        )}

        {/* Overdue payments */}
        <div className="rounded-xl border border-gray-200 bg-white/80 p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <CreditCard className="h-5 w-5 text-gray-400" /> Pagos vencidos
          </h2>
          <Separator className="my-3" />
          {stats.overduePayments.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">Sin pagos vencidos</p>
          ) : (
            <div className="space-y-3">
              {stats.overduePayments.slice(0, 5).map((p: any) => {
                const contract = Array.isArray(p.contract) ? p.contract[0] : p.contract;
                const prop = Array.isArray(contract?.property) ? contract.property[0] : contract?.property;
                const ten = Array.isArray(contract?.tenant) ? contract.tenant[0] : contract?.tenant;
                return (
                  <div key={p.id} className="flex items-center justify-between rounded-lg border border-red-100 bg-red-50/30 p-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{prop?.address}{prop?.unit ? ` - ${prop.unit}` : ""}</p>
                      <p className="text-xs text-gray-500">{ten?.full_name} — Vto: {formatDate(p.due_date)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-red-600">{formatCurrency(p.amount_due)}</p>
                      {ten?.phone && (
                        <DashboardWhatsApp type="overdue" phone={ten.phone} tenantName={ten.full_name} propertyAddress={`${prop?.address ?? ""}${prop?.unit ? ` - ${prop.unit}` : ""}`} amount={String(p.amount_due)} period={p.period?.substring(0, 7)} dueDate={p.due_date} />
                      )}
                      <Link href={`/pagos/${p.id}`}>
                        <Button variant="outline" size="sm" className="h-7 px-2">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
              {stats.overduePayments.length > 5 && (
                <Link href="/pagos?status=vencido" className="block text-center text-xs text-teal-600 hover:underline">
                  Ver todos ({stats.overduePayments.length})
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Expiring contracts */}
        <div className="rounded-xl border border-gray-200 bg-white/80 p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Calendar className="h-5 w-5 text-gray-400" /> Contratos por vencer (90 dias)
          </h2>
          <Separator className="my-3" />
          {stats.expiringContracts.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">Sin contratos proximos a vencer</p>
          ) : (
            <div className="space-y-3">
              {stats.expiringContracts.slice(0, 5).map((c: any) => {
                const prop = Array.isArray(c.property) ? c.property[0] : c.property;
                const ten = Array.isArray(c.tenant) ? c.tenant[0] : c.tenant;
                return (
                  <Link key={c.id} href={`/contratos/${c.id}`} className="flex items-center justify-between rounded-lg border border-gray-100 p-3 transition hover:bg-gray-50">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{prop?.address}{prop?.unit ? ` - ${prop.unit}` : ""}</p>
                      <p className="text-xs text-gray-500">{ten?.full_name}</p>
                    </div>
                    <p className="text-sm font-medium text-amber-600">{formatDate(c.end_date)}</p>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Vencen esta semana */}
        <div className="rounded-xl border border-gray-200 bg-white/80 p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Clock className="h-5 w-5 text-gray-400" /> Vencen esta semana
          </h2>
          <Separator className="my-3" />
          {stats.dueThisWeek.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">Sin pagos por vencer en los próximos 7 días</p>
          ) : (
            <div className="space-y-3">
              {stats.dueThisWeek.slice(0, 5).map((p: any) => {
                const contract = Array.isArray(p.contract) ? p.contract[0] : p.contract;
                const prop = Array.isArray(contract?.property) ? contract.property[0] : contract?.property;
                const ten = Array.isArray(contract?.tenant) ? contract.tenant[0] : contract?.tenant;
                return (
                  <Link key={p.id} href={`/pagos/${p.id}`} className="flex items-center justify-between rounded-lg border border-gray-100 p-3 transition hover:bg-gray-50">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{prop?.address}{prop?.unit ? ` - ${prop.unit}` : ""}</p>
                      <p className="text-xs text-gray-500">{ten?.full_name ?? "—"} — Vto: {formatDate(p.due_date)}</p>
                    </div>
                    <p className="text-sm font-medium text-gray-900">{formatCurrency(p.amount_due)}</p>
                  </Link>
                );
              })}
              {stats.dueThisWeek.length > 5 && (
                <p className="text-center text-xs text-gray-400">y {stats.dueThisWeek.length - 5} más…</p>
              )}
            </div>
          )}
        </div>

        {/* Contratos incompletos */}
        <div className="rounded-xl border border-gray-200 bg-white/80 p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <FileWarning className="h-5 w-5 text-rose-400" /> Contratos incompletos
          </h2>
          <p className="mt-1 text-xs text-gray-500">Activos sin comisión cargada — conviene completarlos.</p>
          <Separator className="my-3" />
          {stats.incompleteContracts.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">No hay contratos incompletos 🎉</p>
          ) : (
            <div className="space-y-3">
              {stats.incompleteContracts.slice(0, 5).map((c: any) => {
                const prop = Array.isArray(c.property) ? c.property[0] : c.property;
                const ten = Array.isArray(c.tenant) ? c.tenant[0] : c.tenant;
                return (
                  <Link key={c.id} href={`/contratos/${c.id}/editar`} className="flex items-center justify-between rounded-lg border border-rose-100 bg-rose-50/30 p-3 transition hover:bg-rose-50/60">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{prop?.address}{prop?.unit ? ` - ${prop.unit}` : ""}</p>
                      <p className="text-xs text-gray-500">{ten?.full_name ?? "—"}</p>
                    </div>
                    <span className="text-xs font-medium text-rose-600">Sin comisión</span>
                  </Link>
                );
              })}
              {stats.incompleteContracts.length > 5 && (
                <p className="text-center text-xs text-gray-400">y {stats.incompleteContracts.length - 5} más…</p>
              )}
            </div>
          )}
        </div>

        {/* Pending adjustments */}
        <div className="rounded-xl border border-teal-200 bg-teal-50/30 p-6 shadow-sm lg:col-span-2">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <TrendingUp className="h-5 w-5 text-teal-600" /> Aumentos a ajustar
            {stats.pendingAdjustments.length > 0 && (
              <span className="rounded-full bg-teal-100 px-2 py-0.5 text-sm font-medium text-teal-700">{stats.pendingAdjustments.length}</span>
            )}
          </h2>
          <Separator className="my-3" />
          {stats.pendingAdjustments.length === 0 ? (
            <p className="py-4 text-center text-sm text-gray-400">No hay aumentos pendientes de ajustar</p>
          ) : (
            <div className="space-y-5">
              {adjustmentsByMonth.map((group) => (
                <div key={group.period}>
                  <div className="mb-2 flex items-center gap-2">
                    <h3 className="text-sm font-semibold capitalize text-gray-700">{group.label}</h3>
                    <span className="rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-700">{group.items.length}</span>
                  </div>
                  <div className="space-y-3">
                    {group.items.map((a) => {
                      const indexLabel = INDEX_TYPES[a.indexType as keyof typeof INDEX_TYPES] ?? a.indexType;
                      return (
                        <div key={a.contractId} className="flex items-center justify-between rounded-lg border border-teal-100 bg-white p-4">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{a.propertyAddress}</p>
                            <p className="text-xs text-gray-500">
                              {a.tenantName ?? "—"} — {indexLabel} cada {a.frequencyMonths}m — Actual: {formatCurrency(a.currentRent, a.currency as CurrencyType)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <p className="text-sm font-medium text-teal-700">{formatDate(a.nextDate)}</p>
                              <p className="text-xs text-teal-600">Proximo aumento</p>
                            </div>
                            <Link href={`/contratos/${a.contractId}`}>
                              <Button size="sm" className="bg-teal-600 hover:bg-teal-700">
                                Aplicar
                              </Button>
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
