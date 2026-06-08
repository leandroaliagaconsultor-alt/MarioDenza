import Link from "next/link";
import { TrendingUp, ChevronDown, CheckCircle2 } from "lucide-react";
import { getUpcomingAdjustments, getRecentAdjustments } from "./actions";
import { PageHeader } from "@/components/ui/page-header";
import { AdjustmentPanel } from "@/app/(app)/contratos/[id]/adjustment-panel";
import { NotifyAdjustmentButton } from "./notify-adjustment-button";
import { INDEX_TYPES } from "@/lib/types/enums";
import type { CurrencyType } from "@/lib/types/enums";
import { formatCurrency, formatDate } from "@/lib/utils/format";

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  vencido: { label: "Vencido", cls: "bg-red-100 text-red-700" },
  este_mes: { label: "Este mes", cls: "bg-amber-100 text-amber-700" },
  proximo_mes: { label: "Próximo mes", cls: "bg-yellow-100 text-yellow-700" },
  programado: { label: "Programado", cls: "bg-gray-100 text-gray-600" },
};

export default async function AumentosPage() {
  const [pending, recent] = await Promise.all([
    getUpcomingAdjustments(),
    getRecentAdjustments(),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Aumentos"
        description="Pendientes de ajustar y el histórico de aumentos aplicados"
      />

      {/* Pendientes de ajustar */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Pendientes de ajustar</h2>

        {pending.length === 0 ? (
          <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-4 text-sm">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
            <span className="font-medium text-green-800">No tenés ajustes pendientes.</span>
          </div>
        ) : (
          pending.map((a) => {
            const currency = a.currency as CurrencyType;
            const badge = STATUS_BADGE[a.status] ?? STATUS_BADGE.programado;
            const indexLabel = INDEX_TYPES[a.indexType as keyof typeof INDEX_TYPES] ?? a.indexType;
            return (
              <details key={a.contractId} className="group rounded-xl border border-gray-200 bg-white/80 shadow-sm">
                <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4 [&::-webkit-details-marker]:hidden">
                  <ChevronDown className="h-4 w-4 shrink-0 text-gray-400 transition-transform group-open:rotate-180" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-gray-900">{a.propertyAddress}</p>
                    <p className="mt-0.5 truncate text-xs text-gray-500">
                      {a.tenantName ?? "—"} · {indexLabel} · cada {a.frequencyMonths} meses
                    </p>
                  </div>
                  <div className="hidden text-right sm:block">
                    <p className="text-[11px] uppercase tracking-wide text-gray-400">Próximo aumento</p>
                    <p className="text-sm font-medium text-gray-700">{formatDate(a.nextDate)}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.cls}`}>
                    {badge.label}
                  </span>
                </summary>

                <div className="space-y-4 border-t border-gray-100 px-5 py-4">
                  {a.indexType !== "IPC" && (
                    <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                      Este contrato ajusta por <span className="font-medium">{indexLabel}</span>, pero el cálculo automático
                      es por IPC. Para {indexLabel} usá el monto manual al aplicar.
                    </p>
                  )}

                  <AdjustmentPanel contractId={a.contractId} currency={currency} currentRent={a.currentRent} />

                  <div className="flex flex-wrap items-center gap-2">
                    {(a.tenantPhone || a.ownerPhone) && (
                      <NotifyAdjustmentButton
                        tenantName={a.tenantName ?? ""}
                        tenantPhone={a.tenantPhone}
                        ownerName={a.ownerName}
                        ownerPhone={a.ownerPhone}
                        propertyAddress={a.propertyAddress}
                        currentRent={a.currentRent}
                        currency={currency}
                        nextDate={a.nextDate}
                      />
                    )}
                    <Link href={`/contratos/${a.contractId}`} className="text-sm font-medium text-teal-600 hover:text-teal-700">
                      Ver contrato →
                    </Link>
                  </div>
                </div>
              </details>
            );
          })
        )}
      </section>

      {/* Últimos aumentos aplicados */}
      {recent.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Últimos aumentos</h2>

          {recent.map((g) => {
            const currency = g.currency as CurrencyType;
            return (
              <div key={g.contractId} className="rounded-xl border border-gray-200 bg-white/80 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-gray-900">{g.propertyAddress}</p>
                    <p className="mt-0.5 truncate text-xs text-gray-500">
                      {g.tenantName ?? "—"} · último: {formatDate(g.lastDate)} · {formatCurrency(g.lastNewRent, currency)}{" "}
                      <span className="text-green-700">(+{g.lastPercentage}%)</span>
                    </p>
                  </div>
                  {(g.tenantPhone || g.ownerPhone) && (
                    <NotifyAdjustmentButton
                      tenantName={g.tenantName ?? ""}
                      tenantPhone={g.tenantPhone}
                      ownerName={g.ownerName}
                      ownerPhone={g.ownerPhone}
                      propertyAddress={g.propertyAddress}
                      currentRent={g.lastPreviousRent}
                      defaultNewRent={g.lastNewRent}
                      currency={currency}
                      nextDate={g.lastDate}
                    />
                  )}
                </div>

                <details className="group mt-3">
                  <summary className="flex cursor-pointer list-none items-center gap-1.5 text-sm font-medium text-teal-600 [&::-webkit-details-marker]:hidden">
                    <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                    Ver histórico ({g.history.length})
                  </summary>
                  <div className="mt-2 overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="text-xs font-medium uppercase text-gray-400">
                          <th className="pb-1.5 pr-4">Fecha</th>
                          <th className="pb-1.5 pr-4 text-right">Anterior</th>
                          <th className="pb-1.5 pr-4 text-right">Nuevo</th>
                          <th className="pb-1.5 pr-4 text-right">Variación</th>
                          <th className="hidden pb-1.5 sm:table-cell">Índice</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {g.history.map((h, i) => (
                          <tr key={i}>
                            <td className="py-1.5 pr-4 text-gray-900">{formatDate(h.appliedDate)}</td>
                            <td className="py-1.5 pr-4 text-right text-gray-500">{formatCurrency(h.previousRent, currency)}</td>
                            <td className="py-1.5 pr-4 text-right font-medium text-gray-900">{formatCurrency(h.newRent, currency)}</td>
                            <td className="py-1.5 pr-4 text-right text-green-700">+{h.percentage}%</td>
                            <td className="hidden py-1.5 text-gray-500 sm:table-cell">
                              {INDEX_TYPES[h.indexType as keyof typeof INDEX_TYPES] ?? h.indexType}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}
