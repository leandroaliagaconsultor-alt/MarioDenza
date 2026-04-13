import {
  Building2, FileText, TrendingUp, AlertTriangle, Calendar, CreditCard, MessageCircle, ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { getDashboardStats } from "./actions";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { INDEX_TYPES } from "@/lib/types/enums";
import { DashboardWhatsApp } from "./dashboard-whatsapp";

function StatCard({ title, value, subtitle, icon: Icon, color }: {
  title: string; value: string; subtitle?: string; icon: React.ElementType; color: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white/80 p-5 shadow-sm backdrop-blur-sm">
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
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Overdue payments */}
        <div className="rounded-xl border border-gray-200 bg-white/80 p-6 shadow-sm backdrop-blur-sm">
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
        <div className="rounded-xl border border-gray-200 bg-white/80 p-6 shadow-sm backdrop-blur-sm">
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

        {/* Pending adjustments */}
        <div className="rounded-xl border border-teal-200 bg-teal-50/30 p-6 shadow-sm lg:col-span-2">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <TrendingUp className="h-5 w-5 text-teal-600" /> Aumentos proximos (30 dias)
          </h2>
          <Separator className="my-3" />
          {stats.pendingAdjustments.length === 0 ? (
            <p className="py-4 text-center text-sm text-gray-400">No hay aumentos programados para los proximos 30 dias</p>
          ) : (
            <div className="space-y-3">
              {stats.pendingAdjustments.map((a: any) => {
                const contract = Array.isArray(a.contract) ? a.contract[0] : a.contract;
                const prop = Array.isArray(contract?.property) ? contract.property[0] : contract?.property;
                const ten = Array.isArray(contract?.tenant) ? contract.tenant[0] : contract?.tenant;
                const indexLabel = INDEX_TYPES[a.index_type as keyof typeof INDEX_TYPES] ?? a.index_type;
                return (
                  <div key={a.id} className="flex items-center justify-between rounded-lg border border-teal-100 bg-white p-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {prop?.address}{prop?.unit ? ` - ${prop.unit}` : ""}
                      </p>
                      <p className="text-xs text-gray-500">
                        {ten?.full_name} — {indexLabel} cada {a.frequency_months}m — Actual: {formatCurrency(contract?.current_rent ?? 0, contract?.currency ?? "ARS")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="text-sm font-medium text-teal-700">{formatDate(a.next_adjustment_date)}</p>
                        <p className="text-xs text-teal-600">Proximo aumento</p>
                      </div>
                      <Link href={`/contratos/${a.contract_id}`}>
                        <Button size="sm" className="bg-teal-600 hover:bg-teal-700">
                          Aplicar
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
