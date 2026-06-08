import { notFound } from "next/navigation";
import { getOwnerLiquidationDetail } from "../actions";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Separator } from "@/components/ui/separator";
import { PAYMENT_STATUSES, PAYMENT_STATUS_COLORS } from "@/lib/types/enums";
import type { PaymentStatus, CurrencyType } from "@/lib/types/enums";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { PayoutActions } from "./payout-actions";

interface Props {
  params: Promise<{ ownerId: string }>;
  searchParams: Promise<{ period?: string }>;
}

function currentPeriod() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default async function LiquidacionDetailPage({ params, searchParams }: Props) {
  const { ownerId } = await params;
  const { period: periodParam } = await searchParams;
  const period = periodParam || currentPeriod();

  const liq = await getOwnerLiquidationDetail(ownerId, period);
  if (!liq) notFound();
  const currency = liq.currency as CurrencyType;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title={liq.ownerName}
        description={`Liquidación del período ${period}`}
        backHref={`/liquidaciones?period=${period}`}
        action={
          liq.liquidatedAt ? (
            <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600">
              Liquidado {formatDate(liq.liquidatedAt)}
            </span>
          ) : liq.ready ? (
            <span className="inline-flex rounded-full bg-teal-100 px-3 py-1 text-sm font-medium text-teal-700">
              Listo para liquidar
            </span>
          ) : (
            <span className="inline-flex rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-700">
              Faltan {liq.total - liq.collected} de {liq.total}
            </span>
          )
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white/80 p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500">Cobradas</p>
          <p className="mt-1 text-lg font-bold text-gray-900">{liq.collected}/{liq.total}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white/80 p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500">Total cobrado</p>
          <p className="mt-1 text-lg font-bold text-gray-900">{formatCurrency(liq.totalCollected, currency)}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white/80 p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500">Comisión</p>
          <p className="mt-1 text-lg font-bold text-teal-600">{formatCurrency(liq.totalCommission, currency)}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white/80 p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500">A pagar al dueño</p>
          <p className="mt-1 text-lg font-bold text-gray-900">{formatCurrency(liq.totalPayout, currency)}</p>
        </div>
      </div>

      {/* Desglose */}
      <div className="rounded-xl border border-gray-200 bg-white/80 p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-700">Desglose por propiedad</h2>
        <Separator className="my-3" />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs font-medium uppercase text-gray-500">
                <th className="pb-2 pr-4">Propiedad</th>
                <th className="hidden pb-2 pr-4 sm:table-cell">Inquilino</th>
                <th className="pb-2 pr-4 text-right">Cobrado</th>
                <th className="hidden pb-2 pr-4 text-right sm:table-cell">Comisión</th>
                <th className="pb-2 pr-4 text-right">A pagar</th>
                <th className="pb-2">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {liq.rows.map((r) => (
                <tr key={r.paymentId}>
                  <td className="py-2 pr-4 text-gray-900">{r.propertyAddress}</td>
                  <td className="hidden py-2 pr-4 text-gray-500 sm:table-cell">{r.tenantName ?? "—"}</td>
                  <td className="py-2 pr-4 text-right text-gray-700">{formatCurrency(r.amountPaid, currency)}</td>
                  <td className="hidden py-2 pr-4 text-right text-gray-500 sm:table-cell">{formatCurrency(r.commission, currency)}</td>
                  <td className="py-2 pr-4 text-right font-medium text-gray-900">{formatCurrency(r.ownerPayout, currency)}</td>
                  <td className="py-2">
                    <StatusBadge
                      label={PAYMENT_STATUSES[r.status as PaymentStatus]}
                      colorClass={PAYMENT_STATUS_COLORS[r.status as PaymentStatus]}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-gray-200 pt-3 text-sm font-semibold">
          <span className="text-gray-900">Total a pagar al dueño</span>
          <span className="text-teal-700">{formatCurrency(liq.totalPayout, currency)}</span>
        </div>

        {!liq.ready && (
          <p className="mt-4 rounded-lg bg-yellow-50 px-3 py-2 text-xs text-yellow-700">
            Esta liquidación todavía no está lista: faltan cobrar {liq.total - liq.collected} de {liq.total} propiedades.
          </p>
        )}
      </div>

      {/* Actions */}
      <PayoutActions
        ownerId={ownerId}
        ownerName={liq.ownerName}
        ownerPhone={liq.ownerPhone}
        period={period}
        currency={currency}
        total={liq.totalPayout}
        ready={liq.ready}
        liquidatedAt={liq.liquidatedAt}
        rows={liq.rows.map((r) => ({ address: r.propertyAddress, payout: r.ownerPayout }))}
      />
    </div>
  );
}
