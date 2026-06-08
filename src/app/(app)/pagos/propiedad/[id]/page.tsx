import Link from "next/link";
import { notFound } from "next/navigation";
import { getPropertyPaymentHistory } from "../../actions";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { PAYMENT_STATUSES, PAYMENT_STATUS_COLORS } from "@/lib/types/enums";
import type { PaymentStatus, CurrencyType } from "@/lib/types/enums";
import { formatCurrency } from "@/lib/utils/format";
import { QuickCollectButton } from "./quick-collect-button";

interface Props {
  params: Promise<{ id: string }>;
}

const DAY_MS = 1000 * 60 * 60 * 24;

export default async function PropertyPaymentsPage({ params }: Props) {
  const { id } = await params;
  let data;
  try {
    data = await getPropertyPaymentHistory(id);
  } catch {
    notFound();
  }
  const { property, payments } = data;

  const prop = property as {
    id: string;
    address: string;
    unit?: string;
    owner: { id: string; full_name: string } | { id: string; full_name: string }[] | null;
  };
  const owner = Array.isArray(prop.owner) ? prop.owner[0] : prop.owner;
  const today = Date.now();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title={`${prop.address}${prop.unit ? ` - ${prop.unit}` : ""}`}
        description={owner ? `Dueño: ${owner.full_name}` : "Historial de pagos"}
        backHref="/pagos"
      />

      <div className="rounded-xl border border-gray-200 bg-white/80 p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-700">
          Historial de pagos ({payments.length}) · del más antiguo al más reciente
        </h2>

        {payments.length === 0 ? (
          <p className="mt-3 text-sm text-gray-400">Sin pagos registrados</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-medium uppercase text-gray-500">
                  <th className="px-3 py-2">Período</th>
                  <th className="px-3 py-2">Monto</th>
                  <th className="hidden px-3 py-2 sm:table-cell">Inquilino</th>
                  <th className="px-3 py-2">Estado</th>
                  <th className="px-3 py-2">Atraso</th>
                  <th className="px-3 py-2 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {payments.map((p) => {
                  const contract = Array.isArray(p.contract) ? p.contract[0] : p.contract;
                  const currency = (contract?.currency ?? "ARS") as CurrencyType;
                  const tenantRaw = contract?.tenant;
                  const tenantName =
                    (Array.isArray(tenantRaw) ? tenantRaw[0] : tenantRaw)?.full_name ?? "—";
                  const isPaid = p.status === "pagado";
                  const due = new Date(p.due_date).getTime();
                  const overdueDays = !isPaid && due < today ? Math.floor((today - due) / DAY_MS) : 0;
                  return (
                    <tr key={p.id} className="relative transition-colors hover:bg-gray-50/50">
                      <td className="px-3 py-2">
                        <Link
                          href={`/pagos/${p.id}`}
                          className="font-medium text-gray-900 after:absolute after:inset-0 hover:text-teal-600"
                        >
                          {p.period.substring(0, 7)}
                        </Link>
                      </td>
                      <td className="px-3 py-2 text-gray-900">{formatCurrency(p.amount_due, currency)}</td>
                      <td className="hidden px-3 py-2 text-gray-500 sm:table-cell">{tenantName}</td>
                      <td className="px-3 py-2">
                        <StatusBadge
                          label={PAYMENT_STATUSES[p.status as PaymentStatus]}
                          colorClass={PAYMENT_STATUS_COLORS[p.status as PaymentStatus]}
                        />
                      </td>
                      <td className="px-3 py-2">
                        {overdueDays > 0 ? (
                          <span className="font-medium text-red-600">
                            {overdueDays} día{overdueDays > 1 ? "s" : ""}
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {!isPaid ? (
                          <QuickCollectButton paymentId={p.id} />
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
