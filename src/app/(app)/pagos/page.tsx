import Link from "next/link";
import { CreditCard, ChevronDown, UserCheck } from "lucide-react";
import { getPaymentsByProperty } from "./actions";
import { PageHeader } from "@/components/ui/page-header";
import { SearchInput } from "@/components/ui/search-input";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { GeneratePaymentsButton } from "./generate-button";
import { PAYMENT_STATUSES, PAYMENT_STATUS_COLORS } from "@/lib/types/enums";
import type { PaymentStatus, CurrencyType } from "@/lib/types/enums";
import { formatCurrency, formatDate } from "@/lib/utils/format";

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function PagosPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const groups = await getPaymentsByProperty(q);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pagos"
        description="Pagos agrupados por propiedad"
        action={<GeneratePaymentsButton />}
      />

      <div className="flex flex-wrap items-center gap-4">
        <SearchInput placeholder="Buscar por propiedad, inquilino o dueño..." />
      </div>

      {groups.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title={q ? "Sin resultados" : "Sin pagos"}
          description={q ? "No se encontraron pagos." : "Genera los pagos del mes con el boton de arriba."}
        />
      ) : (
        <div className="space-y-3">
          {groups.map((g) => {
            const currency = g.currency as CurrencyType;
            return (
              <details key={g.propertyId} className="group rounded-xl border border-gray-200 bg-white/80 shadow-sm">
                <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4 [&::-webkit-details-marker]:hidden">
                  <ChevronDown className="h-4 w-4 shrink-0 text-gray-400 transition-transform group-open:rotate-180" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-gray-900">
                      {g.address}{g.unit ? ` - ${g.unit}` : ""}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-gray-500">
                      <UserCheck className="h-3 w-3 shrink-0" />
                      {g.tenantName ?? "Sin inquilino"}
                      {g.ownerName ? <span className="text-gray-400"> · Dueño: {g.ownerName}</span> : null}
                    </p>
                  </div>
                  <div className="hidden text-right sm:block">
                    <p className="text-[11px] uppercase tracking-wide text-gray-400">Último pago</p>
                    <p className="text-sm font-medium text-gray-700">
                      {g.lastPaidDate ? formatDate(g.lastPaidDate) : "—"}
                    </p>
                  </div>
                  {g.overdueCount > 0 ? (
                    <span className="shrink-0 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
                      {g.overdueCount} vencido{g.overdueCount > 1 ? "s" : ""}
                    </span>
                  ) : g.pendingCount > 0 ? (
                    <span className="shrink-0 rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-700">
                      {g.pendingCount} pendiente{g.pendingCount > 1 ? "s" : ""}
                    </span>
                  ) : (
                    <span className="shrink-0 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                      Al día
                    </span>
                  )}
                </summary>

                <div className="border-t border-gray-100 px-5 py-3">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
                    Últimos {g.recent.length} pago{g.recent.length > 1 ? "s" : ""}
                  </p>
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="text-xs font-medium uppercase text-gray-400">
                        <th className="pb-1.5 pr-4">Mes</th>
                        <th className="pb-1.5 pr-4">Monto</th>
                        <th className="pb-1.5 pr-4">Fecha de pago</th>
                        <th className="pb-1.5">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {g.recent.map((p) => (
                        <tr key={p.id}>
                          <td className="py-1.5 pr-4">
                            <Link href={`/pagos/${p.id}`} className="text-gray-900 hover:text-teal-600">
                              {p.period.substring(0, 7)}
                            </Link>
                          </td>
                          <td className="py-1.5 pr-4 text-gray-700">{formatCurrency(p.amount_due, currency)}</td>
                          <td className="py-1.5 pr-4 text-gray-500">
                            {p.paid_date ? formatDate(p.paid_date) : "—"}
                          </td>
                          <td className="py-1.5">
                            <StatusBadge
                              label={PAYMENT_STATUSES[p.status as PaymentStatus]}
                              colorClass={PAYMENT_STATUS_COLORS[p.status as PaymentStatus]}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <Link
                    href={`/pagos/propiedad/${g.propertyId}`}
                    className="mt-3 inline-block text-sm font-medium text-teal-600 hover:text-teal-700"
                  >
                    Ver historial completo →
                  </Link>
                </div>
              </details>
            );
          })}
        </div>
      )}
    </div>
  );
}
