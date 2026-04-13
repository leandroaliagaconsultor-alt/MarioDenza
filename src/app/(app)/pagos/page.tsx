import Link from "next/link";
import { CreditCard, Eye } from "lucide-react";
import { getPayments, getAvailablePeriods } from "./actions";
import { PageHeader } from "@/components/ui/page-header";
import { SearchInput } from "@/components/ui/search-input";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { GeneratePaymentsButton } from "./generate-button";
import { PeriodFilter } from "./period-filter";
import { PAYMENT_STATUSES, PAYMENT_STATUS_COLORS } from "@/lib/types/enums";
import type { PaymentStatus, CurrencyType } from "@/lib/types/enums";
import { formatCurrency, formatDate } from "@/lib/utils/format";

interface Props {
  searchParams: Promise<{ q?: string; status?: string; period?: string }>;
}

export default async function PagosPage({ searchParams }: Props) {
  const { q, status, period } = await searchParams;
  const [payments, periods] = await Promise.all([
    getPayments({ search: q, status, period }),
    getAvailablePeriods(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pagos"
        description="Registro y seguimiento de pagos"
        action={<GeneratePaymentsButton />}
      />

      <div className="flex flex-wrap items-center gap-4">
        <SearchInput placeholder="Buscar por propiedad o inquilino..." />

        {/* Status filters */}
        <div className="flex gap-2">
          <Link href={`/pagos${period ? `?period=${period}` : ""}`}>
            <Button variant={!status ? "default" : "outline"} size="sm" className={!status ? "bg-teal-600" : ""}>Todos</Button>
          </Link>
          {Object.entries(PAYMENT_STATUSES).map(([key, label]) => (
            <Link key={key} href={`/pagos?status=${key}${period ? `&period=${period}` : ""}${q ? `&q=${q}` : ""}`}>
              <Button variant={status === key ? "default" : "outline"} size="sm" className={status === key ? "bg-teal-600" : ""}>{label}</Button>
            </Link>
          ))}
        </div>

        {/* Period filter */}
        {periods.length > 0 && <PeriodFilter periods={periods} />}
      </div>

      {payments.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title={q || status || period ? "Sin resultados" : "Sin pagos"}
          description={q || status || period ? "No se encontraron pagos." : "Genera los pagos del mes con el boton de arriba."}
        />
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white/80 shadow-sm backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-medium uppercase tracking-wider text-gray-500">
                  <th className="px-6 py-3">Propiedad</th>
                  <th className="px-6 py-3">Inquilino</th>
                  <th className="px-6 py-3">Periodo</th>
                  <th className="px-6 py-3">Monto</th>
                  <th className="px-6 py-3">Vencimiento</th>
                  <th className="px-6 py-3">Estado</th>
                  <th className="px-6 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {payments.map((p) => {
                  const contract = p.contract as {
                    id: string; currency: CurrencyType; commission_percentage: number;
                    property: { address: string; unit?: string } | null;
                    tenant: { full_name: string } | null;
                  } | null;
                  const currency = (contract?.currency ?? "ARS") as CurrencyType;
                  return (
                    <tr key={p.id} className="transition-colors hover:bg-gray-50/50">
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {contract?.property?.address}{contract?.property?.unit ? ` - ${contract.property.unit}` : ""}
                      </td>
                      <td className="px-6 py-4 text-gray-600">{contract?.tenant?.full_name ?? "—"}</td>
                      <td className="px-6 py-4 text-gray-500">{p.period.substring(0, 7)}</td>
                      <td className="px-6 py-4 font-medium text-gray-900">{formatCurrency(p.amount_due, currency)}</td>
                      <td className="px-6 py-4 text-gray-500">{formatDate(p.due_date)}</td>
                      <td className="px-6 py-4">
                        <StatusBadge label={PAYMENT_STATUSES[p.status as PaymentStatus]} colorClass={PAYMENT_STATUS_COLORS[p.status as PaymentStatus]} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link href={`/pagos/${p.id}`}>
                          <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
