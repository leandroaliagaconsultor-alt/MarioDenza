import {
  Building2, FileText, TrendingUp, AlertTriangle, Calendar, CreditCard,
} from "lucide-react";
import Link from "next/link";
import { getDashboardStats } from "./actions";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { Separator } from "@/components/ui/separator";

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
                  <Link key={p.id} href={`/pagos/${p.id}`} className="flex items-center justify-between rounded-lg border border-gray-100 p-3 transition hover:bg-gray-50">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{prop?.address}{prop?.unit ? ` - ${prop.unit}` : ""}</p>
                      <p className="text-xs text-gray-500">{ten?.full_name} — Vto: {formatDate(p.due_date)}</p>
                    </div>
                    <p className="text-sm font-bold text-red-600">{formatCurrency(p.amount_due)}</p>
                  </Link>
                );
              })}
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
        {stats.pendingAdjustments.length > 0 && (
          <div className="rounded-xl border border-gray-200 bg-white/80 p-6 shadow-sm backdrop-blur-sm lg:col-span-2">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <TrendingUp className="h-5 w-5 text-gray-400" /> Aumentos pendientes (30 dias)
            </h2>
            <Separator className="my-3" />
            <div className="space-y-3">
              {stats.pendingAdjustments.map((a: any) => {
                const contract = Array.isArray(a.contract) ? a.contract[0] : a.contract;
                const prop = Array.isArray(contract?.property) ? contract.property[0] : contract?.property;
                const ten = Array.isArray(contract?.tenant) ? contract.tenant[0] : contract?.tenant;
                return (
                  <Link key={a.id} href={`/contratos/${a.contract_id}`} className="flex items-center justify-between rounded-lg border border-gray-100 p-3 transition hover:bg-gray-50">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{prop?.address}</p>
                      <p className="text-xs text-gray-500">{ten?.full_name} — Alquiler actual: {formatCurrency(contract?.current_rent ?? 0)}</p>
                    </div>
                    <p className="text-sm font-medium text-teal-600">{formatDate(a.next_adjustment_date)}</p>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
