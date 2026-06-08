import Link from "next/link";
import { Wallet, ChevronDown } from "lucide-react";
import { getOwnerLiquidations, getLiquidationPeriods } from "./actions";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchInput } from "@/components/ui/search-input";
import { StatusBadge } from "@/components/ui/status-badge";
import { PeriodSelect } from "./period-select";
import { PAYMENT_STATUSES, PAYMENT_STATUS_COLORS } from "@/lib/types/enums";
import type { PaymentStatus, CurrencyType } from "@/lib/types/enums";
import { formatCurrency, formatDate } from "@/lib/utils/format";

interface Props {
  searchParams: Promise<{ period?: string; q?: string }>;
}

function currentPeriod() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default async function LiquidacionesPage({ searchParams }: Props) {
  const { period: periodParam, q } = await searchParams;
  const period = periodParam || currentPeriod();
  const [groups, periods] = await Promise.all([
    getOwnerLiquidations(period, q),
    getLiquidationPeriods(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Liquidaciones"
        description="Cobro a dueños — listo cuando todas sus propiedades fueron cobradas"
        action={<PeriodSelect periods={periods} current={period} />}
      />

      <div className="flex flex-wrap items-center gap-4">
        <SearchInput placeholder="Buscar por dueño, propiedad o inquilino..." />
      </div>

      {groups.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title={q ? "Sin resultados" : "Sin liquidaciones"}
          description={q ? "No se encontraron dueños con esa búsqueda." : "No hay pagos para este período. Generá los pagos del mes en la sección Pagos."}
        />
      ) : (
        <div className="space-y-3">
          {groups.map((g) => {
            const currency = g.currency as CurrencyType;
            return (
              <details key={g.ownerId} className="group rounded-xl border border-gray-200 bg-white/80 shadow-sm">
                <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4 [&::-webkit-details-marker]:hidden">
                  <ChevronDown className="h-4 w-4 shrink-0 text-gray-400 transition-transform group-open:rotate-180" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-gray-900">{g.ownerName}</p>
                    <p className="mt-0.5 truncate text-xs text-gray-500">
                      {g.collected}/{g.total} cobradas
                    </p>
                  </div>
                  <div className="hidden text-right sm:block">
                    <p className="text-[11px] uppercase tracking-wide text-gray-400">A pagar</p>
                    <p className="text-sm font-medium text-gray-700">{formatCurrency(g.totalPayout, currency)}</p>
                  </div>
                  {g.liquidatedAt ? (
                    <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                      Liquidado {formatDate(g.liquidatedAt)}
                    </span>
                  ) : g.ready ? (
                    <span className="shrink-0 rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-medium text-teal-700">
                      Listo para liquidar
                    </span>
                  ) : (
                    <span className="shrink-0 rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-700">
                      Faltan {g.total - g.collected}
                    </span>
                  )}
                </summary>

                <div className="border-t border-gray-100 px-5 py-3">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="text-xs font-medium uppercase text-gray-400">
                        <th className="pb-1.5 pr-4">Propiedad</th>
                        <th className="hidden pb-1.5 pr-4 sm:table-cell">Inquilino</th>
                        <th className="pb-1.5 pr-4 text-right">A pagar</th>
                        <th className="pb-1.5">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {g.rows.map((r) => (
                        <tr key={r.paymentId}>
                          <td className="py-1.5 pr-4 text-gray-900">{r.propertyAddress}</td>
                          <td className="hidden py-1.5 pr-4 text-gray-500 sm:table-cell">{r.tenantName ?? "—"}</td>
                          <td className="py-1.5 pr-4 text-right font-medium text-gray-900">{formatCurrency(r.ownerPayout, currency)}</td>
                          <td className="py-1.5">
                            <StatusBadge
                              label={PAYMENT_STATUSES[r.status as PaymentStatus]}
                              colorClass={PAYMENT_STATUS_COLORS[r.status as PaymentStatus]}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-2.5">
                    <span className="text-sm font-semibold text-gray-900">
                      Total a pagar: <span className="text-teal-700">{formatCurrency(g.totalPayout, currency)}</span>
                    </span>
                    <Link
                      href={`/liquidaciones/${g.ownerId}?period=${period}`}
                      className="text-sm font-medium text-teal-600 hover:text-teal-700"
                    >
                      Ver detalle completo →
                    </Link>
                  </div>
                </div>
              </details>
            );
          })}
        </div>
      )}
    </div>
  );
}
